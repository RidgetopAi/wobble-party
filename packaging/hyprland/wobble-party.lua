-- Wobble Party window rules for Hyprland (Omarchy 4 Lua config). Optional.
--
-- Install: copy this file to ~/.config/hypr/wobble-party.lua and add
--
--     require("hypr.wobble-party")
--
-- to the bottom of ~/.config/hypr/hyprland.lua.

-- Chromium ignores --class in --app mode and derives the class from the app
-- URL; the launcher always opens http://wobble.localhost:<port>/.
-- Pass the match as a string (a { class = ... } table did not match).
local WOBBLE = "^(chrome-wobble\\.localhost__.*)$"

-- Opaque: the party is lit for full colour; the default translucency
-- desaturates it.
o.window(WOBBLE, { opacity = "1.0 1.0", tag = "-default-opacity" })

-- Float it big and centred instead of tiling (remove to keep it tiled).
o.window(WOBBLE, { float = true })
o.window(WOBBLE, { center = true })
o.window(WOBBLE, { size = { 1600, 900 } })

-- The page holds a wake lock while music plays; this also keeps the screen
-- on whenever the party is fullscreen, music or not.
o.window(WOBBLE, { idle_inhibit = "fullscreen" })

-- Suggested keybinding (put it in ~/.config/hypr/bindings.lua):
-- o.bind("SUPER + ALT + W", "Wobble Party", "wobble-party toggle")
