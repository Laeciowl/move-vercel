import { request } from "./client";

export interface PathStep {
  id: string;
  title: string;
  description?: string;
  order_position: number;
  mentor_id?: string;
  completed?: boolean;
  step_type?: string;
  external_link?: string | null;
  completed_at?: string | null;
  completed_automatically?: boolean;
}

export interface Path {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  icon?: string;
  estimated_duration_minutes?: number;
  steps?: PathStep[];
  steps_count?: number;
}

export interface PathProgress {
  path_id: string;
  completed_steps: string[];
  percent: number;
  completed_at?: string | null;
}

export const pathsApi = {
  list: () => request<{ paths: Path[] }>(`/api/v1/paths`),
  get: (id: string) => request<{ path: Path }>(`/api/v1/paths/${id}`),
  myProgress: () =>
    request<{ progress: PathProgress[] }>(`/api/v1/me/path_progress`),
  completeStep: (pathId: string, stepId: string) =>
    request<{ step_progress: { step_id: string; completed_at: string } }>(
      `/api/v1/paths/${pathId}/steps/${stepId}/complete`,
      { method: "POST" },
    ),
};
