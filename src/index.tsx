import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ISheetContents } from 'trc-sheet/sheetContents';

import TRCContext from 'trc-react/dist/context/TRCContext';

import * as precints from 'trc-analyze/precinct';

import { Copy } from 'trc-react/dist/common/Copy';
import { DescriptionList } from 'trc-react/dist/common/DescriptionList';
import { Panel } from 'trc-react/dist/common/Panel';
import { DownloadCsv } from 'trc-react/dist/DownloadCsv';
import { PluginShell } from 'trc-react/dist/PluginShell';
import { SimpleTable } from 'trc-react/dist/SimpleTable';
import { SheetContainer, IMajorState } from 'trc-react/dist/SheetContainer';

export class App extends React.Component {
  static contextType = TRCContext;

  private sum(data: ISheetContents, columnName: string): string {
    const col = data[columnName];
    if (!col) {
      return 'na';
    }

    let total = 0;
    for (let i in col) {
      const value = col[i];

      const x = parseFloat(value);
      if (x != NaN) {
        total += x;
      }
    }

    return total.toLocaleString();
  }

  private totals(precinctContents: ISheetContents) {
    const totals: ISheetContents = {};
    const names: string[] = [];
    const vals: string[] = [];
    totals['Names'] = names;
    totals['Value'] = vals;

    names.push('Total Count');
    vals.push(this.sum(precinctContents, 'count'));

    names.push('Total Households');
    vals.push(this.sum(precinctContents, 'HouseholdCount'));

    names.push('Total GOP');
    vals.push(this.sum(precinctContents, 'GOPCount'));

    names.push('Total Dem');
    vals.push(this.sum(precinctContents, 'DEMCount'));

    names.push('Total Contacts');
    vals.push(this.sum(precinctContents, 'ContactCount'));

    names.push('Total Contacted Households');
    vals.push(this.sum(precinctContents, 'ContactHouseholdCount'));

    names.push('Total Targets');
    vals.push(this.sum(precinctContents, 'Targets'));

    return totals;
  }

  render() {
    const b = new precints.BuildPrecinctReport();
    const p = b.build(this.context._contents);
    const precinctContents = precints.BuildPrecinctReport.convert(p);

    // compute totals and render
    const totals: ISheetContents = this.totals(precinctContents);

    return (
        <PluginShell
          description="Provide basic precinct level reporting"
          title="Precinct Report"
        >
          <Panel>
            <p>
              This is a report split out by precinct.
            </p>
            <DescriptionList entries={[
              ['Version', this.context._info.LatestVersion],
              ['Total Rows', this.context._info.CountRecords]
            ]} />
          </Panel>

          <Panel>
            <h3>Description of table columns</h3>
            <DescriptionList entries={[
              ['Names', 'Name of precinct'],
              ['Count', '# of voters in this precinct'],
              ['HouseholdCount', '# of unique households in this precinct'],
              ['GOPCount', '# of people with gop partyId (1,2)'],
              ['DemCount', '# of people with dem partyId (4,5)'],
              ['GOPPercent', '(GOPCount) / (GOPCount + DemCount)'],
              ['ContactCount', '# of people contacted (ResultOfContact is not blank)'],
              ['ContactHouseholdCount', '# of households contacted'],
              ['Targets', <>
                # of targets in this precinct (see <a href="https://blog.voter-science.com/canvass-targeting/">setting
                targets</a> for details)
              </>]
            ]} />
          </Panel>

          <Panel>
            <Copy>
              <h3>Precinct report</h3>
              <p>You can download as a spreadsheet to sort and pivot this data:</p>
            </Copy>
            <DownloadCsv data={precinctContents} />
          </Panel>

          <Panel>
            <p>Totals:</p>
            <SimpleTable data={totals} />
          </Panel>

          <Panel>
            <p>Here's the per-precinct listing:</p>
            <SimpleTable data={precinctContents} />
          </Panel>
        </PluginShell>
    );
  }
}

ReactDOM.render(
  <SheetContainer
      fetchContents={true}
      requireTop={false}
  >
      <App />
  </SheetContainer>,
  document.getElementById('app')
);
