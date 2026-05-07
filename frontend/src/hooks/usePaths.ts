import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pathsApi } from "@/integrations/api/paths";

export const pathKeys = {
  all: ["paths"] as const,
  list: ["paths", "list"] as const,
  detail: (id: string) => ["paths", id] as const,
  myProgress: ["paths", "my-progress"] as const,
};

export const usePathsList = () =>
  useQuery({ queryKey: pathKeys.list, queryFn: pathsApi.list });

export const usePath = (id: string) =>
  useQuery({
    queryKey: pathKeys.detail(id),
    queryFn: () => pathsApi.get(id),
    enabled: !!id,
  });

export const useMyPathProgress = () =>
  useQuery({ queryKey: pathKeys.myProgress, queryFn: pathsApi.myProgress });

export const useCompleteStep = (pathId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => pathsApi.completeStep(pathId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pathKeys.detail(pathId) });
      queryClient.invalidateQueries({ queryKey: pathKeys.myProgress });
    },
  });
};
