"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FiltroVendedor({ vendedores, actual }: { vendedores: { id: string; nombre: string }[]; actual: string | null }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  return (
    <select
      className="campo w-auto"
      value={actual ?? ""}
      onChange={(e) => {
        const p = new URLSearchParams(params);
        if (e.target.value) p.set("vendedor", e.target.value);
        else p.delete("vendedor");
        router.push(`${ruta}${p.size ? "?" + p : ""}`);
      }}
    >
      <option value="">Todos los vendedores</option>
      {vendedores.map((v) => (
        <option key={v.id} value={v.id}>{v.nombre}</option>
      ))}
    </select>
  );
}
