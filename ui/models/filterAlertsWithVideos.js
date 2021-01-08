import { summaryStatusMap, visualMetrics } from '../perfherder/constants';
import { addResultsLink, getFrameworkName } from '../perfherder/helpers';

import JobModel from './job';

export default class FilterAlertsWithVideos {
  constructor(alertSummary, frameworks) {
    this.alertSummary = alertSummary;
    this.framework = getFrameworkName(frameworks, alertSummary.framework);
  }

  async getFilteredAlerts() {
    let alerts;
    if (
      this.framework === 'browsertime' &&
      this.anyAlertWithVideoResults(this.alertSummary)
    ) {
      alerts = this.addLinks(
        this.alertSummary,
        this.alertSummary.repository,
        this.alertSummary.push_id,
        this.alertSummary.prev_push_id,
      );
    }

    return alerts;
  }

  async addLinks(alertSummary, repo, pushId, prevPushId) {
    const [jobList, prevJobList] = await Promise.all([
      JobModel.getList({ repo, push_id: pushId }, { fetchAll: true }),
      JobModel.getList({ repo, push_id: prevPushId }, { fetchAll: true }),
    ]);

    // add task ids for current rev and previous rev to every relevant alert item
    alertSummary = this.addLinksToAlerts(alertSummary, jobList);
    alertSummary = this.addLinksToAlerts(alertSummary, prevJobList);

    return alertSummary.alerts;
  }

  containsVismet(title) {
    return visualMetrics.find((metric) => title.includes(metric));
  }

  anyAlertWithVideoResults(alertSummary) {
    // For the moment the browsertime vismet are separate from the pageload ones
    // that's why we need to filter them out. Also, we're retrieving the video results
    // for regressions only
    const any = alertSummary.alerts.filter((alert) =>
      this.shouldHaveVideoLinks(alert),
    );
    return any.length > 0;
  }

  shouldHaveVideoLinks(alert) {
    return (
      alert.status !== summaryStatusMap.reassigned &&
      alert.status !== summaryStatusMap.downstream &&
      alert.status !== summaryStatusMap.invalid &&
      alert.is_regression === true &&
      !this.containsVismet(alert.title)
    );
  }

  addLinksToAlerts(alertSummary, jobList) {
    const alerts = alertSummary.alerts.map((alert) => {
      if (this.shouldHaveVideoLinks(alert)) {
        const job = jobList.data.find(
          (j) =>
            j.searchStr.includes(alert.series_signature.suite) &&
            j.searchStr.includes(alert.series_signature.machine_platform) &&
            j.resultStatus === 'success',
        );

        if (job) {
          if (alertSummary.revision === job.push_revision) {
            return { ...alert, results_link: addResultsLink(job.task_id) };
          }
          if (alertSummary.prev_push_revision === job.push_revision) {
            return { ...alert, prev_results_link: addResultsLink(job.task_id) };
          }
        }
      }
      return alert;
    });

    alertSummary.alerts = alerts;
    return alertSummary;
  }
}
