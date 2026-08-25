import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Table from "@mui/joy/Table";
import Tab from "@mui/joy/Tab";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Tabs from "@mui/joy/Tabs";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { GradeChip } from "@/components/common/GradeChip";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { PlagiarismChip } from "@/components/common/PlagiarismChip";
import { StatusChip } from "@/components/common/StatusChip";
import { fetchProgressReport, fetchAssessmentReports, selectProgressReport, selectProgressReportStatus, selectDsReports, selectDsReportsStatus } from "@/features/reports/reportsSlice";
import { fetchSubmissions, selectSubmissions } from "@/features/assessments/submissionsSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDateTime } from "@/lib/utils";
import type { LandGroupName } from "@/types";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

// Admin-only /admin/reports — build-plan.md Phase 6 feature 25. Four
// sub-views in one page (Progress / Completion / Plagiarism / DS Reports)
// rather than four routes, since they all share the same course-scoped data
// fetches and filters.
export function ReportsPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const rows = useAppSelector(selectProgressReport);
  const progressStatus = useAppSelector(selectProgressReportStatus);
  const submissions = useAppSelector(selectSubmissions);
  const dsReports = useAppSelector(selectDsReports);
  const dsReportsStatus = useAppSelector(selectDsReportsStatus);
  const [landGroupFilter, setLandGroupFilter] = useState<LandGroupName | "all">("all");

  useEffect(() => {
    if (course) {
      dispatch(fetchProgressReport(course.id));
      dispatch(fetchSubmissions(course.id));
      dispatch(fetchAssessmentReports(course.id));
    }
  }, [dispatch, course]);

  if (!course) {
    return (
      <Card>
        <EmptyState icon={Award} title="No active course" description="Choose an active course to view reports." />
      </Card>
    );
  }

  const filteredRows = landGroupFilter === "all" ? rows : rows.filter((r) => r.landGroup === landGroupFilter);
  const outstandingRows = filteredRows.filter((r) => r.outstandingActivities.length > 0);
  const highSimilarity = submissions.filter((s) => (s.plagiarismScore ?? 0) >= 40);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
          Reports
        </Typography>
        <Select size="sm" value={landGroupFilter} onChange={(_, v) => v && setLandGroupFilter(v)} sx={{ minWidth: "150px" }}>
          <Option value="all">All Land Groups</Option>
          <Option value="red">Red Land</Option>
          <Option value="blue">Blue Land</Option>
        </Select>
      </div>

      {progressStatus === "loading" && rows.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : (
        <Tabs defaultValue="progress">
          <TabList>
            <Tab value="progress">Progress</Tab>
            <Tab value="completion">Completion</Tab>
            <Tab value="plagiarism">Plagiarism Overview</Tab>
            <Tab value="ds-reports">DS Reports</Tab>
          </TabList>

          <TabPanel value="progress" sx={{ px: 0, py: 3 }}>
            {filteredRows.length === 0 ? (
              <Card>
                <EmptyState icon={Award} title="No officers yet" />
              </Card>
            ) : (
              <Card>
                <Table sx={tableSx}>
                  <thead>
                    <tr>
                      <th>Army Number</th>
                      <th>Name</th>
                      <th>Land Group</th>
                      <th style={{ textAlign: "right" }}>Progress</th>
                      <th style={{ textAlign: "right" }}>Weighted Avg</th>
                      <th>Projected Degree Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.officerId}>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{row.armyNumber}</td>
                        <td>{row.fullName}</td>
                        <td>
                          <LandGroupChip landGroup={row.landGroup} />
                        </td>
                        <td style={{ textAlign: "right" }}>{row.progressPercent}%</td>
                        <td style={{ textAlign: "right" }}>{row.weightedAverage !== null ? `${row.weightedAverage.toFixed(0)}%` : "—"}</td>
                        <td>{row.degreeClass ? <GradeChip band={row.degreeClass} /> : <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>Pending</Typography>}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            )}
          </TabPanel>

          <TabPanel value="completion" sx={{ px: 0, py: 3 }}>
            {outstandingRows.length === 0 ? (
              <Card>
                <EmptyState icon={Award} title="No outstanding mandatory activities" description="Every officer has cleared every mandatory activity." />
              </Card>
            ) : (
              <Card>
                <Table sx={tableSx}>
                  <thead>
                    <tr>
                      <th>Army Number</th>
                      <th>Name</th>
                      <th>Land Group</th>
                      <th>Outstanding Activities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingRows.map((row) => (
                      <tr key={row.officerId}>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{row.armyNumber}</td>
                        <td>{row.fullName}</td>
                        <td>
                          <LandGroupChip landGroup={row.landGroup} />
                        </td>
                        <td>{row.outstandingActivities.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            )}
          </TabPanel>

          <TabPanel value="plagiarism" sx={{ px: 0, py: 3 }}>
            {highSimilarity.length === 0 ? (
              <Card>
                <EmptyState icon={Award} title="No high-similarity submissions" description="Nothing above the 40% review threshold across this course." />
              </Card>
            ) : (
              <Card>
                <Table sx={tableSx}>
                  <thead>
                    <tr>
                      <th>Officer</th>
                      <th>Activity</th>
                      <th>Land Group</th>
                      <th>Submitted</th>
                      <th>Similarity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highSimilarity.map((s) => (
                      <tr key={s.id}>
                        <td>
                          {s.officerName} <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{s.armyNumber}</span>
                        </td>
                        <td>{s.activityName}</td>
                        <td>
                          <LandGroupChip landGroup={s.landGroup} />
                        </td>
                        <td>{formatDateTime(s.submittedAt)}</td>
                        <td>
                          <PlagiarismChip status={s.plagiarismStatus ?? "not_checked"} score={s.plagiarismScore ?? null} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            )}
          </TabPanel>

          <TabPanel value="ds-reports" sx={{ px: 0, py: 3 }}>
            {dsReportsStatus === "loading" && dsReports.length === 0 ? (
              <div className="flex justify-center py-16">
                <CircularProgress size="md" />
              </div>
            ) : dsReports.length === 0 ? (
              <Card>
                <EmptyState icon={Award} title="No reports submitted yet" description="DS assessment reports will appear here once submitted." />
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {dsReports.map((report) => (
                  <Card key={report.id} title={report.activityName}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                          {report.directingStaffName}
                        </Typography>
                        <StatusChip label={formatDateTime(report.submittedAt)} tone="info" />
                      </div>
                      <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                        {report.body}
                      </Typography>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
}
