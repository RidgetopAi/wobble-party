import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

// Wobble Party in the bar: a little wobbler. Still when the party is off,
// wobbling like a weeble while it is on. Click to open/close the party.
//
// `omarchy plugin add` delivers this QML but no binaries, so when the
// launcher is missing the click builds and installs it instead (cargo),
// reporting progress through notifications.
BarWidget {
  id: root
  moduleName: "ridgetopai.wobble-party"

  // Qt.resolvedUrl gives a file:// URL; shell commands need a path.
  readonly property string pluginDir:
    String(Qt.resolvedUrl(".")).replace(/^file:\/\//, "").replace(/\/$/, "")

  // "running" | "stopped" | "missing" | "installing"
  property string state: "stopped"
  readonly property bool running: state === "running"

  implicitWidth: barSize
  implicitHeight: barSize

  Process {
    id: status
    running: false
    command: ["sh", "-c", "command -v wobble-party >/dev/null 2>&1 && wobble-party status || echo missing"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        if (root.state === "installing") return
        var s = String(text || "").trim()
        root.state = (s === "running" || s === "missing") ? s : "stopped"
      }
    }
  }

  function poll() {
    if (!status.running) status.running = true
  }

  Component.onCompleted: poll()

  Timer {
    interval: 2000
    running: true
    repeat: true
    onTriggered: root.poll()
  }

  Process {
    id: toggle
    running: false
    command: ["wobble-party", "toggle"]
    onExited: root.poll()
  }

  Process {
    id: install
    running: false
    workingDirectory: root.pluginDir
    command: ["sh", "-c",
      "notify-send 'Wobble Party' 'Building the wobble brain… (a minute or two)';"
      + " if ./packaging/install.sh >\"${XDG_STATE_HOME:-$HOME/.local/state}/wobble-party-install.log\" 2>&1;"
      + " then notify-send 'Wobble Party' 'Installed! Click the wobbler to start the party.';"
      + " else notify-send -u critical 'Wobble Party' 'Install failed — see ~/.local/state/wobble-party-install.log'; exit 1; fi"]
    onExited: function (code) {
      root.state = "stopped"
      root.poll()
    }
  }

  Image {
    id: icon
    anchors.centerIn: parent
    width: Math.round(root.barSize * 0.72)
    height: width
    sourceSize.width: width * 2
    sourceSize.height: height * 2
    source: Qt.resolvedUrl("packaging/wobble-party.svg")
    smooth: true
    opacity: root.running ? 1.0 : 0.72
    // Weebles pivot on their round bottom.
    transformOrigin: Item.Bottom

    Behavior on opacity { NumberAnimation { duration: 200 } }

    SequentialAnimation on rotation {
      running: root.running || root.state === "installing"
      loops: Animation.Infinite
      alwaysRunToEnd: true
      NumberAnimation { to: 14; duration: 260; easing.type: Easing.OutQuad }
      NumberAnimation { to: -11; duration: 420; easing.type: Easing.InOutSine }
      NumberAnimation { to: 6; duration: 360; easing.type: Easing.InOutSine }
      NumberAnimation { to: 0; duration: 300; easing.type: Easing.OutBack }
    }
  }

  MouseArea {
    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor

    onEntered: {
      if (!root.bar) return
      var tip = root.state === "running" ? "Wobble Party is on — click to close"
        : root.state === "missing" ? "Wobble Party — click to install (builds with cargo)"
        : root.state === "installing" ? "Wobble Party — building…"
        : "Wobble Party — click to start the party"
      root.bar.showTooltip(root, tip)
    }
    onExited: if (root.bar) root.bar.hideTooltip(root)

    onClicked: {
      if (root.state === "installing") return
      if (root.state === "missing") {
        root.state = "installing"
        install.running = true
        return
      }
      if (!toggle.running) toggle.running = true
    }
  }
}
