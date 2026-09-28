#!/usr/bin/env bash
set -u
cd /home/ridgetop/projects/wobble-party
OUT=out/promo; LOG=$OUT/desktop_themes.log; : > $LOG
hyprctl dispatch 'hl.dsp.focus({ workspace = "6" })' >/dev/null
sleep 1.5
gpu-screen-recorder -w DP-1 -f 60 -fm cfr -q very_high -k h264 -cursor no -c mp4 -o $OUT/desktop_split.mp4 >$OUT/gsr.log 2>&1 &
REC=$!
sleep 1.5
T0=$(date +%s.%N)
mpv --no-video --really-quiet --start=37.5 --end=110 "music/Wobble Party.mp3" &
PLAY=$!
stamp(){ awk -v a="$(date +%s.%N)" -v b="$T0" -v n="$1" 'BEGIN{printf "%.2f %s\n", a-b, n}' >> $LOG; }
stamp "Hackerman"
sleep 6
for th in "Tokyo Night" "Catppuccin Latte" "Gruvbox" "Rose Pine" "Retro 82" "White" "Vantablack"; do
  stamp "$th"; omarchy-theme-set "$th" >/dev/null 2>&1; stamp "$th done"; sleep 6
done
kill $PLAY 2>/dev/null
kill -INT $REC; wait $REC
omarchy-theme-set "Hackerman" >/dev/null 2>&1
hyprctl dispatch 'hl.dsp.window.close({ window = "address:0x55ba9b900ef0" })' >/dev/null; sleep 0.5; hyprctl dispatch 'hl.dsp.focus({ workspace = "8" })' >/dev/null
echo "rec offset: recording began ~1.5s before T0" >> $LOG
