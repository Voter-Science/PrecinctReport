// Sample 'Hello World' Plugin template.
// Demonstrates:
// - typescript
// - using trc npm modules and browserify
// - uses promises. 
// - basic scaffolding for error reporting. 
// This calls TRC APIs and binds to specific HTML elements from the page.  

import * as XC from 'trc-httpshim/xclient'
import * as common from 'trc-httpshim/common'

import * as core from 'trc-core/core'

import * as trcSheet from 'trc-sheet/sheet'
import {ISheetContents } from 'trc-sheet/sheetContents'
import * as trcSheetEx from 'trc-sheet/sheetEx'

import * as plugin from 'trc-web/plugin'
import * as trchtml from 'trc-web/html'

import * as bcl from 'trc-analyze/collections'
import * as analyze from 'trc-analyze/core'
import * as precints from 'trc-analyze/precinct'


// Installed via:
//   npm install --save-dev @types/jquery
// requires tsconfig: "allowSyntheticDefaultImports" : true 
declare var $: JQueryStatic;

// Provide easy error handle for reporting errors from promises.  Usage:
//   p.catch(showError);
declare var showError: (error: any) => void; // error handler defined in index.html

export class MyPlugin {
    private _sheet: trcSheet.SheetClient;
    private _pluginClient: plugin.PluginClient;

    public static BrowserEntryAsync(
        auth: plugin.IStart,
        opts: plugin.IPluginOptions
    ): Promise<MyPlugin> {

        var pluginClient = new plugin.PluginClient(auth, opts);

        // Do any IO here...

        var throwError = false; // $$$ remove this

        var plugin2 = new MyPlugin(pluginClient);
        return plugin2.InitAsync().then(() => {
            if (throwError) {
                throw "some error";
            }

            return plugin2;
        });
    }

    // Expose constructor directly for tests. They can pass in mock versions. 
    public constructor(p: plugin.PluginClient) {
        this._sheet = new trcSheet.SheetClient(p.HttpClient, p.SheetId);
    }


    // Make initial network calls to setup the plugin. 
    // Need this as a separate call from the ctor since ctors aren't async. 
    private InitAsync(): Promise<void> {
        return this._sheet.getInfoAsync().then(info => {
            this.updateInfo(info);
        });
    }

    // Display sheet info on HTML page
    public updateInfo(info: trcSheet.ISheetInfoResult): void {
        $("#SheetName").text(info.Name);
        $("#ParentSheetName").text(info.ParentName);
        $("#SheetVer").text(info.LatestVersion);
        $("#RowCount").text(info.CountRecords);

        $("#LastRefreshed").text(new Date().toLocaleString());

        trchtml.Loading("contents");
        //$("#contents").empty();
        //$("#contents").text("Loading...");

        var b = new precints.BuildPrecinctReport();


        this._sheet.getSheetContentsAsync().then((contents) => {

            var p = b.build(contents);

            var precinctContents = precints.BuildPrecinctReport.convert(p);


            var e = document.getElementById("download");
            trchtml.DownloadHelper.appendDownloadCsvButton(e, () => precinctContents);


            var render = new trchtml.RenderSheet("contents", precinctContents);
            // could set other options on render() here
            render.render();

            // compute totals and render
            var totals : ISheetContents = { };
            var names : string[] = [] ;
            var vals : string[] = [];
            totals["Names"] = names;
            totals["Value"] = vals;

            names.push("Total Count");
            vals.push(this.sum(precinctContents, "count"));

            names.push("Total Households");
            vals.push(this.sum(precinctContents, "HouseholdCount"));

            names.push("Total GOP");
            vals.push(this.sum(precinctContents, "GOPCount"));

            names.push("Total Dem");
            vals.push(this.sum(precinctContents, "DEMCount"));

            names.push("Total Contacts");
            vals.push(this.sum(precinctContents, "ContactCount"));

            names.push("Total Contacted Households");
            vals.push(this.sum(precinctContents, "ContactHouseholdCount"));

            names.push("Total Targets");
            vals.push(this.sum(precinctContents, "Targets"));

            var render = new trchtml.RenderSheet("totals", totals);
            // could set other options on render() here
            render.render();

            
        }).catch(showError);
    }


    private sum(data : ISheetContents, columnName : string ) : string {
        var col = data[columnName];
        if (!col) {
            return "na";
        }

        var total = 0;
        for(var i in col) {
            var value = col[i];

            var x = parseFloat(value);
            if (x != NaN)  {
                total += x;
            }
        }

        return total.toLocaleString();
    }
}
