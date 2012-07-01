// Extension developed by Giulio Piemontese (piemontese.giulio@gmail.com)
// https://github.com/gpiemont

// Largely Based on Radeon Power Profile Manager
 
// (Francisco Pina Martins https://github.com/StuntsPT )
//
// Licence: GPLv2
//
// Copyright 2012 Francisco Pina Martins

//

//
// This file is part of Radeon Power Profile Manager.
//
// Radeon Power Profile Manager is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.

// Radeon Power Profile Manager is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// If not, see <http://www.gnu.org/licenses/>.

const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;

const Clutter = imports.gi.Clutter

function nv_log(message)
{
	log("[nouveau pm switch] " + message + "\n");
	global.log("[nouveau pm switch] " + message + "\n");
}

// ProfileManager function
function ProfileManager(metadata)
{
    // Main sysfs files (card 0,1)

    this.file = [] ;
    this.file[0] = "/sys/class/drm/card0/device/performance_level";
    this.file[1] = "/sys/class/drm/card1/device/performance_level"
    this.second_card = this.file[1];

    // Paths to sysfs dirs 

    this.path = [] ;
    this.path[0] = "/sys/class/drm/card0/device/"
    this.path[1] = "/sys/class/drm/card1/device/"

    this.perflvls = AvailPerflvls(this.path[0]);
    
    nv_log("Available Performance Levels : " + this.perflvls);

    if ( this.perflvls == 0 ) {
	return 0;
    }

    this.Icon = Clutter.Texture.new_from_file(_(metadata.path + "/nun.svg"));

    //this.Icon = [] ;
    //for ( let pl = 0; pl < this.perflvls ; pl++) {
    // 	this.Icon[pl] = Clutter.Texture.new_from_file(_(metadata.path+"/icons/nv_p" + pl + ".png"));
    //}
 
    this._init();

    return 1;
}

// Prototype
ProfileManager.prototype =
{
	__proto__: PanelMenu.Button.prototype,

    	_init: function()
    	{
	    PanelMenu.Button.prototype._init.call(this, St.Align.START);

	    this.temp = new St.BoxLayout();
	    this.temp.set_width(18);
	    this.temp.set_height(18);

	    this.actor.add_actor(this.temp);
	    this.actor.add_style_class_name('panel-status-button');
	    this.actor.has_tooltip = true;

            this.perflvl = [];
            
	    for ( let pl = 0; pl < this.perflvls ; pl++) {
                this.perflvl[pl] = _(this.path[0] + 'performance_level_' + pl) ;
		nv_log(_("perflvl[" + pl + "]" + " : " + this.perflvl[pl]));
            }

	    this._refresh();

        },

	_refresh: function()
	{
	    let varFile = 0; 
	    let cardno = 0;

	    let temp = this.temp;
 
	    let tasksMenu = this.menu;
	    let temp = this.temp;

	    let Icon = 0;

	    // Clear
	    tasksMenu.removeAll();

	    if (cardno = CheckForNVFile(this.file[0]))
	    {
		varFile = this.file[0];
	    } else if (cardno = CheckForNVFile(this.second_card)) {
	    	varFile = this.second_card;
	    } 

	    // Sync
	    if (varFile)
	    {
		let content = Shell.get_file_contents_utf8_sync(varFile).split("\n");
		let profile = content[0].substring(content[0].indexOf(',') + 1);
		this.curplvl = profile.trim() ;
		
		// No icon update for now
		//Icon = this.Icon[this.curplvl];

		temp.add_actor(this.Icon,1);

	    	// Performance level switch section
	    	let plswitchSection = new PopupMenu.PopupMenuSection();

	    	//Create power profile changing buttons:
	   	this.powerbutton = [];
	   
            	for ( let pl = 0; pl < this.perflvls ; pl++) 
		{
			let entryname = "Performance Level " + pl ;

			// Usually, the boot performance entry level
			if ( pl == 1 )
				entryname = entryname + " (boot)"

			item = new PopupMenu.PopupMenuItem(_(entryname));
					
			let p = pl;
			if ( p == this.curplvl)
				item.setShowDot(true);

	    		//Give the buttons an action:
			item.connect('activate', function()
                	{
                       		//temp.remove_actor(Icon);
                       		changePerflvl(p,varFile);
                	}); 

			this.powerbutton[pl] = item ;
			tasksMenu.addMenuItem(item);
	    	}

	   }	  
	},

	enable: function()
	{
	    Main.panel._rightBox.insert_child_at_index(this.actor, 0);
	    Main.panel._menus.addMenu(this.menu);

	    // Refresh menu
	    let fileM = Gio.file_new_for_path(this.file[0]);
	    this.monitor = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
	    this.monitor.connect('changed', Lang.bind(this, this._refresh));
	},

	disable: function()
	{
	    Main.panel._menus.removeMenu(this.menu);
	    Main.panel._rightBox.remove_actor(this.actor);
	    this.monitor.cancel();
	}
}


// Change performance level to 'n' in sysfs 

function changePerflvl(n,file)
{
    if (CheckForNVFile(file))
    {
//	Old setting method, needed "fixed" permissions on file
//	let f = Gio.file_new_for_path(file);
//	let raw = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
//      Shell.write_string_to_stream (raw, n + "\n" );

	nv_log("Setting new perflvl: " + n);
	
	let [success, argv] = GLib.shell_parse_argv(_("pkexec /bin/sh -c " + "\"" + " echo " + n + " > " + file + "\""));
	[success, pid ] = GLib.spawn_async_with_pipes(null, argv, null, 
					GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, null, null);

	if ( success && pid != 0) {
        	GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function(pid,status) {
                                                      GLib.spawn_close_pid(pid); }, null);
	}

    }
}


// Checks if we're actually dealing with a nouveau card.
// Probably unneeded but it tell us the card number, so let's keep it for future purposes 
 
function CheckForNVFile(filename)
{
    if (GLib.file_test(filename, GLib.FileTest.EXISTS) && filename.indexOf("performance_level") != -1)
    {
	if (filename.indexOf("/card1/") != -1 ) { 
		nv_log("Working on secondary card");
		return 2;
	}

	return 1;
    }

    return 0;
}

// How many performance levels do we have?
// XXX Actually tells us if cardX is nouveau

function AvailPerflvls(path)
{
	// Check for at most 8 performance levels
	// NOUVEAU_PM_MAX_LEVELS #defined to 8 in nouveau_perf.c

	let p;
   	for ( p = 0 ; p < 8 ; p++ ) 
	{
		if ( GLib.file_test(path + '/performance_level_' + p, GLib.FileTest.EXISTS) != 1)
			break;
	}

	return p;
}
 
// Init function
function init(metadata)
{
	return new ProfileManager(metadata);
}
