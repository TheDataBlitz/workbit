import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { RootRedirect } from './RootRedirect'
import {
  AuthGate,
  MainLayout,
  LoginScreen,
  WorkspaceProjectsScreen,
  WorkspaceMemberScreen,
  WorkspaceTeamsScreen,
  WorkspacesScreen,
  CreateTeamScreen,
  CreateMemberScreen,
  CreateProjectScreen,
  TeamIssuesScreenWrapper,
  TeamProjectsScreenWrapper,
  TeamProjectDetailIndexRedirect,
  TeamProjectDetailTabScreenWrapper,
  TeamProjectNewDocumentScreenWrapper,
  TeamProjectEditDocumentScreenWrapper,
  IssueDetailScreenWrapper,
  ProfilePage,
} from '../pages'
import { LandingPage } from '../landing'

function RedirectToTeamIssues() {
  const { workspaceId, teamId } = useParams<{
    workspaceId: string
    teamId: string
  }>()
  return (
    <Navigate
      to={`/workspace/${workspaceId}/team/${teamId}/issues/active`}
      replace
    />
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/workspaces"
        element={
          <AuthGate>
            <WorkspacesScreen />
          </AuthGate>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/workspace/:workspaceId"
        element={
          <AuthGate>
            <MainLayout />
          </AuthGate>
        }
      >
        <Route index element={<Navigate to="workspace/projects" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="workspace/projects"
          element={<WorkspaceProjectsScreen />}
        />
        <Route path="workspace/member" element={<WorkspaceMemberScreen />} />
        <Route path="workspace/member/new" element={<CreateMemberScreen />} />
        <Route path="workspace/teams" element={<WorkspaceTeamsScreen />} />
        <Route path="workspace/teams/new" element={<CreateTeamScreen />} />
        <Route
          path="workspace/projects/new"
          element={<CreateProjectScreen />}
        />
        <Route path="team/:teamId" element={<RedirectToTeamIssues />} />
        <Route
          path="team/:teamId/issues/:tab"
          element={<TeamIssuesScreenWrapper />}
        />
        <Route
          path="team/:teamId/issue/:issueId"
          element={<IssueDetailScreenWrapper />}
        />
        <Route
          path="team/:teamId/projects"
          element={<TeamProjectsScreenWrapper />}
        />
        <Route
          path="team/:teamId/projects/new"
          element={<CreateProjectScreen />}
        />
        <Route
          path="team/:teamId/projects/:projectId/documentation/new"
          element={<TeamProjectNewDocumentScreenWrapper />}
        />
        <Route
          path="team/:teamId/projects/:projectId/documentation/:documentId"
          element={<TeamProjectEditDocumentScreenWrapper />}
        />
        <Route
          path="team/:teamId/projects/:projectId/:projectDetailTab"
          element={<TeamProjectDetailTabScreenWrapper />}
        />
        <Route
          path="team/:teamId/projects/:projectId"
          element={<TeamProjectDetailIndexRedirect />}
        />
        <Route
          path="team/:teamId/member/new"
          element={<CreateMemberScreen />}
        />
        <Route path="team/:teamId/teams/new" element={<CreateTeamScreen />} />
      </Route>
    </Routes>
  )
}
