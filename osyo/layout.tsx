import { osyoOnly } from '../../lib/osyoOnly';

export default function OsyoLayout({ children }: { children: React.ReactNode }) {
  osyoOnly();
  return <section className="p-6">{children}</section>;
}
