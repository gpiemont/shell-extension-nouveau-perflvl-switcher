// Extension developed by Giulio Piemontese (piemontese.giulio@gmail.com)
// https://github.com/gpiemont
// Copyright 2012 Giulio Piemontese
// Licence: GPLv2


// Largely Based on Radeon Power Profile Manager
// (Francisco Pina Martins https://github.com/StuntsPT )
//

//
// This file is part of Nouveau Perflvl Switcher
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.

// This file is distributed in the hope that it will be useful,
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
const Clutter = imports.gi.Clutter;

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
    this.file[0] = "/sys/class/drm/card0/device/performance_level" ;
    this.file[1] = "/sys/class/drm/card1/device/performance_level" ;
    this.second_card = this.file[1] ;

    // Paths to sysfs dirs 

    this.path = [] ;
    this.path[0] = "/sys/class/drm/card0/device/" ;
    this.path[1] = "/sys/class/drm/card1/device/" ;

    this.perflvls = 0;

    if (CheckForNVFile(this.file[0])) {
    	this.perflvls = AvailPerflvls(this.path[0]); 
	this.cardno = 0;
    } else if(this.perflvls == 0 && CheckForNVFile(this.second_card)) {
	this.perflvls = AvailPerflvls(this.path[1]);
	this.cardno = 1;
    }

    nv_log( this.perflvls + " available Performance Levels : ") ;

    if ( this.perflvls == 0 ) 
    { 
    	nv_log("No performance levels are available on this card. Maybe not using nouveau?");
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
	__proto__: PanelMenu.SystemStatusButton.prototype,

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
            this.currplvl = 0;
            
	    for ( let pl = 0; pl < this.perflvls ; pl++) {
                this.perflvl[pl] = _(this.path[0] + 'performance_level_' + pl) ;
		nv_log(_("perflvl[" + pl + "]" + " : " + this.perflvl[pl]));
            }

	    this._refresh();

        },

	_refresh: function()
	{
	    let varFile = 0; 
	    let tasksMenu = this.menu;
	    let temp = this.temp;

	    // Clear
	    tasksMenu.removeAll();

	    varFile = this.file[this.cardno];

	    // Sync
	    if (varFile)
	    {
		let content = Shell.get_file_contents_utf8_sync(varFile).split("\n");
		let profile = content[0].substring(content[0].indexOf(',') + 1);
		this.currplvl = profile.trim() ;
		
		// No icon update for now
		//Icon = this.Icon[this.currplvl];

		temp.add_actor(this.Icon,1);

	        // Performance level switch section
		this.switchSection = new PopupMenu.PopupMenuSection();

	        //Create power profile changing buttons:
	   	this.switchSection.powerbutton = [];
	   
            	for ( let pl = 0; pl < this.perflvls ; pl++) 
		{
			let entryname = "Performance Level " + pl ;

			// Usually, the boot performance entry level
			if ( pl == 1 )
				entryname = entryname + " (boot)"

			let item = new PopupMenu.PopupMenuItem(_(entryname));
					
			let p = pl;
			if ( p == this.currplvl)
				item.setShowDot(true);

	    	    	//Give the buttons an action:
			item.connect('activate', function()
                	{
                   		//temp.remove_actor(Icon);
                       		changePerflvl(p,varFile);
                	}); 

			this.switchSection.powerbutton[pl] = item ;
			tasksMenu.addMenuItem(item);
	    	}

	   }	  
	},

        enable: function()
        {
            Main.panel._rightBox.insert_child_at_index(this.actor, 0);
            Main.panel._menus.addMenu(this.menu);

            // Refresh menu
            let fileM = Gio.file_new_for_path(this.file[this.cardno]);
            this.monitor = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
            this.monitor.connect('changed', Lang.bind(this, this._refresh));
        },

        disable: function()
        {
	    Main.panel._rightBox.remove_child(this.actor); 
            //Main.panel._menus.removeMenu(this.menu);
            this.monitor.cancel();
        }

}


// Change performance level to 'n' in sysfs 

function changePerflvl(n,file)
{
    if (CheckForNVFile(file))
    {
	    nv_log("Switching to performance level: " + n);
	    
	    // Full command line (elevates privileges with polkit):
	    // pkexec /bin/sh -c "/bin/echo n > /sys/class/drm/cardX/performance_level"
	    
	    let [success, argv] = GLib.shell_parse_argv(_("pkexec /bin/sh -c " + "\"" + " echo " + n + " > " + file + "\""));	
	    GLib.spawn_async_with_pipes(null, argv, null, GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, 
					null, null);
    }
}


// Checks if we're actually dealing with a nouveau card.
// Probably unneeded, but it tell us the card number so let's keep it for future purposes 
 
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

