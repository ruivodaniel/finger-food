/**
 * Hello-World — public page.
 *
 * Reachable without a session. Calls `GET /api/client/hello-world/public` and
 * renders the response. Reference example for unprotected product pages.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShellNone, Page, PageHeader, Main, MainBody } from "@libs/web-layouts";
import { apiClient } from "@/lib/api/api-client";

export const Route = createFileRoute("/hello-world" as never)({
  component: HelloWorldPublicPage,
});

function useHelloWorldPublic() {
  return useQuery({
    queryKey: ["hello-world", "public"],
    queryFn: async () => {
      const res = await apiClient.api.client["hello-world"].public.$get();
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });
}

function HelloWorldPublicPage() {
  const { data, isLoading, isError } = useHelloWorldPublic();

  return (
    <ShellNone>
      <Page>
        <PageHeader sticky>
          <h1 element="type--heading1">Hello-World (public)</h1>
        </PageHeader>
        <Main>
          <MainBody>
            <div className="flex flex-col items-start gap-4 p-4">
              <p>This page is reachable without an authenticated session.</p>
              <p emphasis="quiet">
                <strong>API response:</strong>{" "}
                {isLoading ? "Loading..." : isError ? "Failed to load" : data?.message}
              </p>
              <Link to={"/hello-world-me" as never} element="type--link">
                Go to the protected version →
              </Link>
            </div>
          </MainBody>
        </Main>
      </Page>
    </ShellNone>
  );
}
