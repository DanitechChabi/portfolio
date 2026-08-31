import { getMessages } from "@/lib/data";
import { MessageList } from "@/components/admin/MessageList";

export default async function AdminMessagesPage() {
  const messages = await getMessages();
  return <MessageList messages={messages} />;
}
