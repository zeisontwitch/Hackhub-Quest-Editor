My local mod folder was empty (except for one unrelated mod but that doesn't interact with anything we're doing).

I loaded up a fresh, clean save.

I copied our two mod and export-mod into the local mods folder.

I started the game, loaded into the save, ran the tw1 command.

The reason it didn't work: In a previous run, I had disabled the export-mod and then removed it from the folder. So the game should've, after its own cleanup run, gotten rid of any references to that mod, but I guess it didn't. Because I just checked which local mods are active, and the new export-mod on a fresh save was disabled. I assume our export-mod doesn't change its own mod-version number? It should be automatically enabled, but the game remembered a previous version and kept it disabled.
