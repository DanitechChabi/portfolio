import { getSubscribers } from "@/lib/data";
import { SubscriberList } from "@/components/admin/SubscriberList";

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers();
  return <SubscriberList subscribers={subscribers} />;
}
