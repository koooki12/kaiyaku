import { AppHeader } from "@/components/AppHeader";
import { NewItemForm } from "@/components/NewItemForm";
import { requireVerifiedUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireVerifiedUser();

  const { error } = await searchParams;

  return (
    <>
      <AppHeader title="解約予定を登録" back={{ href: "/items" }} />
      <NewItemForm error={error} />
    </>
  );
}
