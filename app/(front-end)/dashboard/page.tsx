import React from "react";

import { auth } from "@/auth";
import { UploadForm } from "../components/UploadForm";

export default async function Page() {
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <UploadForm />
    </div>
  );
}
