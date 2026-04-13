import { createBrowserRouter } from "react-router";
import { Home } from "./pages/home";
import { JobSearch } from "./pages/job-search";
import { JobDetail } from "./pages/job-detail";
import { Companies } from "./pages/companies";
import { CompanyProfile } from "./pages/company-profile";
import { About } from "./pages/about";
import { Login } from "./pages/login";
import { Signup } from "./pages/signup";
import { AdminDashboard } from "./pages/admin/dashboard";
import { AdminCompanies } from "./pages/admin/companies";
import { AdminJobs } from "./pages/admin/jobs";
import { AdminPerks } from "./pages/admin/perks";
import { AdminSubscribers } from "./pages/admin/subscribers";
import { AdminAtsSync } from "./pages/admin/ats-sync";
import { AdminInbox } from "./pages/admin/inbox";
import { AdminDiagnostic } from "./pages/admin/diagnostic";
import { RootLayout } from "./components/root-layout";

function CareAnalytics() {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Care Analytics</h1>
      <p className="text-gray-500">Analytics dashboard coming soon.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "jobs", Component: JobSearch },
      { path: "jobs/:id", Component: JobDetail },
      { path: "companies", Component: Companies },
      { path: "company/:id", Component: CompanyProfile },
      { path: "about", Component: About },
      {
        path: "admin",
        Component: AdminDashboard,
        children: [
          { index: true, Component: AdminCompanies },
          { path: "companies", Component: AdminCompanies },
          { path: "jobs", Component: AdminJobs },
          { path: "perks", Component: AdminPerks },
          { path: "subscribers", Component: AdminSubscribers },
          { path: "ats-sync", Component: AdminAtsSync },
          { path: "inbox", Component: AdminInbox },
          { path: "diagnostic", Component: AdminDiagnostic },
          { path: "analytics", Component: CareAnalytics },
        ],
      },
    ],
  },
]);