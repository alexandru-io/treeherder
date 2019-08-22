import $ from 'jquery';
import React from 'react';
import { Table } from 'reactstrap';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faThumbsUp,
} from '@fortawesome/free-solid-svg-icons';

import SimpleTooltip from '../../shared/SimpleTooltip';
import { displayNumber } from '../helpers';
import ProgressBar from '../ProgressBar';

import TableAverage from './TableAverage';

export default class CompareTable extends React.PureComponent {
  getColorClass = (data, type) => {
    const { className, isRegression, isImprovement } = data;
    if (type === 'bar' && !isRegression && !isImprovement) return 'secondary';
    if (type === 'background' && className === 'warning')
      return `bg-${className}`;
    if (type === 'text' && className) return `text-${className}`;
    return className;
  };

  deltaTooltipText = (delta, percentage, improvement) =>
    `Mean difference: ${displayNumber(delta)} (= ${Math.abs(
      displayNumber(percentage),
    )}% ${improvement ? 'better' : 'worse'})`;

  hashCode = text => {
    let hash = 0;
    if (this.length == 0) {
      return hash;
    }
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + char;
      // eslint-disable-next-line no-bitwise
      // hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  scrollToElement = (id, duration) => {
    if (duration === undefined) {
      duration = 50;
    }
    const body = $('body');
    const targetEl = $(id);
    $('body').scrollTo(targetEl, duration);
  };

  render() {
    const { data, testName } = this.props;
    return (
      <Table sz="small" className="compare-table mb-0 px-0" key={testName}>
        <thead>
          <tr id={testName.replace(/ /g, '')} className="subtest-header bg-lightgray">
            <th className="text-left">
              <span>{testName}</span>
              <span className="link-style">
                <a href={this.scrollToElement(testName.replace(/ /g, ''))}>¶</a>
              </span>
            </th>
            <th className="table-width-lg">Base</th>
            {/* empty for less than/greater than data */}
            <th className="table-width-sm" />
            <th className="table-width-lg">New</th>
            <th className="table-width-lg">Delta</th>
            {/* empty for progress bars (magnitude of difference) */}
            <th className="table-width-lg" />
            <th className="table-width-lg">Confidence</th>
            <th className="text-right table-width-md"># Runs</th>
          </tr>
        </thead>
        <tbody>
          {data.map(results => (
            <tr key={results.name}>
              <th className="text-left font-weight-normal pl-1">
                {results.name}
                {results.links && (
                  <span className="result-links">
                    <span className="link-style">
                      <a href={this.scrollToElement(`${testName.replace(/ /g, '')}-${results.name}`)}>
                        ¶
                      </a>
                    </span>
                    {results.links.map(link => (
                      <span key={link.title}>
                        <a href={link.href}>{` ${link.title}`}</a>
                      </span>
                    ))}
                  </span>
                )}
              </th>
              <TableAverage
                value={results.originalValue}
                stddev={results.originalStddev}
                stddevpct={results.originalStddevPct}
                replicates={results.originalRuns}
              />
              <td>
                {results.originalValue < results.newValue && <span>&lt;</span>}
                {results.originalValue > results.newValue && <span>&gt;</span>}
              </td>
              <TableAverage
                value={results.newValue}
                stddev={results.newStddev}
                stddevpct={results.newStddevPct}
                replicates={results.newRuns}
              />
              <td className={this.getColorClass(results, 'background')}>
                {results.delta &&
                Math.abs(displayNumber(results.deltaPercentage)) !== 0 ? (
                  <SimpleTooltip
                    textClass="detail-hint"
                    text={
                      <React.Fragment>
                        {(results.isRegression || results.isImprovement) && (
                          <FontAwesomeIcon
                            icon={
                              results.isRegression
                                ? faExclamationTriangle
                                : faThumbsUp
                            }
                            title={
                              results.isRegression
                                ? 'regression'
                                : 'improvement'
                            }
                            className={this.getColorClass(results, 'text')}
                            size="lg"
                          />
                        )}
                        {`  ${displayNumber(results.deltaPercentage)}%`}
                      </React.Fragment>
                    }
                    tooltipText={this.deltaTooltipText(
                      results.delta,
                      results.deltaPercentage,
                      results.newIsBetter,
                    )}
                  />
                ) : null}
                {results.delta
                  ? Math.abs(displayNumber(results.deltaPercentage)) === 0 && (
                      <span>{displayNumber(results.deltaPercentage)}%</span>
                    )
                  : null}
              </td>
              <td>
                {results.delta ? (
                  <ProgressBar
                    magnitude={results.magnitude}
                    regression={!results.newIsBetter}
                    color={this.getColorClass(results, 'bar')}
                  />
                ) : null}
              </td>
              <td>
                {results.delta &&
                results.confidence &&
                results.confidenceText ? (
                  <SimpleTooltip
                    textClass="detail-hint"
                    text={`${displayNumber(results.confidence)} (${
                      results.confidenceText
                    })`}
                    tooltipText={results.confidenceTextLong}
                  />
                ) : null}
              </td>
              <td className="text-right">
                {results.originalRuns && (
                  <SimpleTooltip
                    textClass="detail-hint"
                    text={`${results.originalRuns.length} / ${results.newRuns.length}`}
                    tooltipText={`${results.originalRuns.length} base / ${results.newRuns.length} new`}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }
}

CompareTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})),
  testName: PropTypes.string.isRequired,
};

CompareTable.defaultProps = {
  data: null,
};
