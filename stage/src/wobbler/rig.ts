/**
 * Weeble physics. A wobbler has no legs: a heavy rounded bottom rolls on the
 * floor and a restoring torque rights it (underdamped, so it wobbles).
 * Choreography never sets poses directly; it applies torques, hops and
 * squash impulses and sets soft targets, and the springs make it feel physical.
 */

export interface SpringSpec {
  /** Natural frequency, Hz. */
  hz: number;
  /** Damping ratio (1 = critical). */
  zeta: number;
}

export class Spring {
  v = 0;
  target = 0;
  constructor(
    public x: number,
    public spec: SpringSpec,
  ) {
    this.target = x;
  }
  step(dt: number, force = 0) {
    const w = 2 * Math.PI * this.spec.hz;
    const a = -w * w * (this.x - this.target) - 2 * this.spec.zeta * w * this.v + force;
    this.v += a * dt;
    this.x += this.v * dt;
  }
}

const GRAVITY = 16;

export class Rig {
  /** Tilt: rotation about x (forward/back) and z (side to side), radians. */
  readonly tiltX: Spring;
  readonly tiltZ: Spring;
  /** Jelly bend of the upper body (lags behind tilt motion). */
  readonly bendX = new Spring(0, { hz: 2.6, zeta: 0.22 });
  readonly bendZ = new Spring(0, { hz: 2.6, zeta: 0.22 });
  /** Stretch (y scale); 1 = rest. Volume is preserved by the shader. */
  readonly stretch = new Spring(1, { hz: 3.8, zeta: 0.28 });
  /** Twist of the upper body (shimmy), radians at the top. */
  readonly twist = new Spring(0, { hz: 5, zeta: 0.35 });
  /** Facing, radians. */
  readonly yaw = new Spring(0, { hz: 1.6, zeta: 0.75 });
  /** Hop height above the floor and vertical velocity. */
  y = 0;
  vy = 0;
  airborne = false;
  /** Seconds since last landing (for landing squash etc). */
  sinceLand = 10;
  /** External torque accumulators, cleared every step. */
  private tqX = 0;
  private tqZ = 0;
  private stretchF = 0;
  private twistF = 0;
  onLand: ((speed: number) => void) | null = null;

  constructor(
    /** Radius of the rolling bottom (sets how far it rolls when tilting). */
    public rollRadius: number,
    wobbliness = 1,
  ) {
    // Heavier/bigger wobblers wobble slower.
    const hz = 1.55 / Math.sqrt(rollRadius / 0.4);
    this.tiltX = new Spring(0, { hz, zeta: 0.16 / wobbliness });
    this.tiltZ = new Spring(0, { hz, zeta: 0.16 / wobbliness });
  }

  /** Continuous torque (rad/s^2) for this step. */
  torque(x: number, z: number) {
    this.tqX += x;
    this.tqZ += z;
  }
  /** Instant change of tilt velocity (rad/s). */
  kick(x: number, z: number) {
    this.tiltX.v += x;
    this.tiltZ.v += z;
  }
  squashKick(v: number) {
    this.stretch.v += v;
  }
  stretchForce(f: number) {
    this.stretchF += f;
  }
  twistForce(f: number) {
    this.twistF += f;
  }
  /** Leave the floor with vertical speed v (units/s). */
  hop(v: number) {
    if (this.airborne) {
      this.vy = Math.max(this.vy, v * 0.6);
      return;
    }
    this.airborne = true;
    this.vy = v;
    this.stretch.v += v * 1.2;
  }
  /** Take-off speed that lands after `airtime` seconds. */
  static hopSpeed(airtime: number) {
    return (GRAVITY * airtime) / 2;
  }

  step(dt: number) {
    // Sub-step for stability at low frame rates.
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) this.substep(h);
    this.tqX = this.tqZ = this.stretchF = this.twistF = 0;
  }

  private substep(h: number) {
    const vxPrev = this.tiltX.v;
    const vzPrev = this.tiltZ.v;
    // Airborne: much weaker righting (no floor contact).
    const air = this.airborne ? 0.25 : 1;
    this.tiltX.step(h, this.tqX);
    this.tiltZ.step(h, this.tqZ);
    if (air < 1) {
      this.tiltX.v = vxPrev + (this.tiltX.v - vxPrev) * air;
      this.tiltZ.v = vzPrev + (this.tiltZ.v - vzPrev) * air;
    }
    // Keep it physical: a weeble can't lie down.
    const lim = 0.75;
    if (Math.abs(this.tiltX.x) > lim) {
      this.tiltX.x = Math.sign(this.tiltX.x) * lim;
      this.tiltX.v *= -0.3;
    }
    if (Math.abs(this.tiltZ.x) > lim) {
      this.tiltZ.x = Math.sign(this.tiltZ.x) * lim;
      this.tiltZ.v *= -0.3;
    }
    // The top lags behind tilt acceleration (jelly). Tilt about +z swings the
    // top toward -x, so the lagging top bends toward +x (and likewise for x/z).
    const ax = (this.tiltX.v - vxPrev) / h;
    const az = (this.tiltZ.v - vzPrev) / h;
    this.bendX.step(h, az * 0.022);
    this.bendZ.step(h, -ax * 0.022);
    this.stretch.step(h, this.stretchF);
    this.twist.step(h, this.twistF);
    this.yaw.step(h);
    if (this.stretch.x < 0.55) {
      this.stretch.x = 0.55;
      this.stretch.v = Math.max(0, this.stretch.v);
    }

    if (this.airborne) {
      this.vy -= GRAVITY * h;
      this.y += this.vy * h;
      if (this.y <= 0) {
        const speed = -this.vy;
        this.y = 0;
        this.vy = 0;
        this.airborne = false;
        this.sinceLand = 0;
        this.stretch.v -= speed * 1.6;
        this.onLand?.(speed);
      }
    }
    this.sinceLand += h;
  }
}
