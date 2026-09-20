import Link from "next/link";
export default function NotFound() {
  return <div className="center pad"><p className="kicker">404</p><h1 className="display-2">This cell is empty.</h1><Link className="btn btn-big" href="/">Back to the block</Link></div>;
}
