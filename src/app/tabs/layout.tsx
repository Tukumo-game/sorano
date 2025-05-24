// app/tabs/layout.tsx
import TabsLayout from '../tabs-layout';

export default function TabsGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TabsLayout>{children}</TabsLayout>;
}
