import Image from "next/image";

export function Logo({ width = 140, height = 32 }: { width?: number; height?: number }) {
  return <Image src="/logo.svg" alt="Agência Simples" width={width} height={height} priority />;
}
