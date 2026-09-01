import Link from "next/link";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return <main className="not-found"><Brand /><p>404 · PUNCHLINE MISSING</p><h1>This battle left the arena.</h1><Link className="button button-primary" href="/">BACK TO THE CROWD</Link></main>;
}
