"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useState, useTransition } from "react";
import { buscarExistentes, importarContactos, type FilaImportacion } from "@/lib/acciones";
import { dinero } from "@/lib/formato";
import type { Moneda } from "@/lib/tipos";

type Columna = "nombre" | "telefono" | "email" | "vehiculo" | "monto" | "moneda" | "vendedor" | "nota";

// Nombres de columna que también aceptamos, por si el Excel viene con otros encabezados.
const ALIAS: Record<string, Columna> = {
  nombre: "nombre", name: "nombre", cliente: "nombre", "nombre y apellido": "nombre",
  telefono: "telefono", tel: "telefono", celular: "telefono", whatsapp: "telefono", phone: "telefono",
  email: "email", mail: "email", correo: "email", "e-mail": "email",
  vehiculo: "vehiculo", interes: "vehiculo", auto: "vehiculo", modelo: "vehiculo",
  monto: "monto", precio: "monto", importe: "monto",
  moneda: "moneda",
  vendedor: "vendedor", asignado: "vendedor",
  nota: "nota", notas: "nota", comentario: "nota", observaciones: "nota",
};

const PLANTILLA =
  "nombre;telefono;email;vehiculo;monto;moneda;vendedor;nota\n" +
  "Juan Pérez;11 5555-1234;juan@mail.com;Toyota Hilux 0km;45000;USD;Vendedor 1;Vino al salón el sábado\n" +
  "Ana Gómez;11 4444-9876;;Fiat Cronos usado;18000000;ARS;Vendedor 2;\n";

type Estado = "ok" | "error" | "duplicado";
type FilaPrevia = { n: number; fila: FilaImportacion; vendedorTexto: string; estado: Estado; problemas: string[] };

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function Importador({ vendedores }: { vendedores: { id: string; nombre: string }[] }) {
  const [filas, setFilas] = useState<FilaPrevia[]>([]);
  const [archivo, setArchivo] = useState<string | null>(null);
  const [incluirDuplicados, setIncluirDuplicados] = useState(false);
  const [resultado, setResultado] = useState<{ error?: string; cantidad?: number } | null>(null);
  const [procesando, startTransition] = useTransition();

  function leer(file: File) {
    setResultado(null);
    setArchivo(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => ALIAS[normalizar(h)] ?? normalizar(h),
      complete: (r) => startTransition(() => validar(r.data)),
    });
  }

  async function validar(datos: Record<string, string>[]) {
    const porNombre = new Map(vendedores.map((v) => [normalizar(v.nombre), v.id]));
    const vistos = new Set<string>();

    const previas: FilaPrevia[] = datos.map((d, i) => {
      const val = (c: Columna) => (d[c] ?? "").trim() || null;
      const problemas: string[] = [];
      const nombre = val("nombre");
      const telefono = val("telefono");
      const email = val("email")?.toLowerCase() ?? null;
      const montoTexto = val("monto");
      const monto = montoTexto ? Number(montoTexto.replace(/[^\d,]/g, "").replace(",", ".")) : null;
      const monedaTexto = normalizar(val("moneda") ?? "usd");
      const moneda: Moneda = ["ars", "pesos", "$"].includes(monedaTexto) ? "ARS" : "USD";
      const vendedorTexto = val("vendedor") ?? "";
      let vendedor_id: string | null = null;

      if (!nombre) problemas.push("Falta el nombre");
      if (!telefono && !email) problemas.push("Falta teléfono o mail");
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problemas.push("Mail inválido");
      if (montoTexto && !Number.isFinite(monto)) problemas.push("Monto inválido");
      if (vendedores.length && vendedorTexto) {
        vendedor_id = porNombre.get(normalizar(vendedorTexto)) ?? null;
        if (!vendedor_id) problemas.push(`No existe el vendedor «${vendedorTexto}»`);
      }

      const conErrores = problemas.length > 0;
      const claves = [telefono?.replace(/\D/g, ""), email].filter((x): x is string => !!x && x.length >= 6);
      const repetida = claves.some((k) => vistos.has(k));
      claves.forEach((k) => vistos.add(k));
      if (repetida) problemas.push("Repetido dentro del archivo");

      return {
        n: i + 2,
        fila: { nombre: nombre ?? "", telefono, email, interes: val("vehiculo"), monto: Number.isFinite(monto) ? monto : null, moneda, vendedor_id, nota: val("nota") },
        vendedorTexto,
        estado: conErrores ? "error" : repetida ? "duplicado" : "ok",
        problemas,
      };
    });

    // Contra la base: ¿ya existe alguien con ese teléfono o mail?
    const telefonos = previas.map((p) => p.fila.telefono?.replace(/\D/g, "")).filter((t): t is string => !!t && t.length >= 6);
    const emails = previas.map((p) => p.fila.email).filter((e): e is string => !!e);
    const { existentes, error } = await buscarExistentes(telefonos, emails);
    if (error) setResultado({ error });
    const existe = new Map(existentes.map((e) => [e.clave, e.vendedor_nombre]));
    for (const p of previas) {
      const k = [p.fila.telefono?.replace(/\D/g, ""), p.fila.email].find((x) => x && existe.has(x));
      if (k) {
        p.problemas.push(`Ya está cargado (lo tiene ${existe.get(k)})`);
        if (p.estado === "ok") p.estado = "duplicado";
      }
    }
    setFilas(previas);
  }

  const aImportar = filas.filter((f) => f.estado === "ok" || (incluirDuplicados && f.estado === "duplicado"));
  const cuenta = (e: Estado) => filas.filter((f) => f.estado === e).length;

  function confirmar() {
    startTransition(async () => {
      const r = await importarContactos(aImportar.map((f) => f.fila));
      setResultado(r);
      if (r.ok) setFilas([]);
    });
  }

  function descargarPlantilla() {
    const url = URL.createObjectURL(new Blob(["﻿" + PLANTILLA], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-contactos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="tarjeta flex flex-wrap items-center gap-3 p-4">
        <label className="boton cursor-pointer">
          Elegir archivo CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
        </label>
        {archivo && <span className="text-sm text-texto-2">{archivo}</span>}
        <button type="button" className="ml-auto text-sm text-accion hover:underline" onClick={descargarPlantilla}>
          Descargar plantilla
        </button>
      </div>

      {resultado?.error && <p className="rounded-md bg-marca/10 p-3 text-sm text-red-400">{resultado.error}</p>}
      {resultado?.cantidad != null && (
        <p className="rounded-md bg-exito/10 p-3 text-sm text-green-400">
          Se importaron {resultado.cantidad} contactos. Quedaron con «Primer contacto» para hoy. <Link href="/hoy" className="underline">Ir a Hoy</Link>
        </p>
      )}
      {procesando && <p className="text-sm text-apagado">Procesando…</p>}

      {filas.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span><strong>{cuenta("ok")}</strong> listas</span>
            <span className="text-amber-400"><strong>{cuenta("duplicado")}</strong> duplicadas</span>
            <span className="text-red-400"><strong>{cuenta("error")}</strong> con errores (no se importan)</span>
            {cuenta("duplicado") > 0 && (
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={incluirDuplicados} onChange={(e) => setIncluirDuplicados(e.target.checked)} />
                Importar duplicadas igual
              </label>
            )}
            <button className="boton ml-auto" disabled={!aImportar.length || procesando} onClick={confirmar}>
              Guardar {aImportar.length} contactos
            </button>
          </div>

          <div className="tarjeta overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-panel-2 text-left text-xs text-apagado">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">Mail</th>
                  <th className="px-3 py-2">Vehículo</th>
                  <th className="px-3 py-2">Monto</th>
                  {vendedores.length > 0 && <th className="px-3 py-2">Vendedor</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.n} className={`border-t border-borde ${f.estado === "error" ? "bg-marca/10" : f.estado === "duplicado" ? "bg-aviso/10" : ""}`}>
                    <td className="px-3 py-2 text-apagado">{f.n}</td>
                    <td className="px-3 py-2">
                      {f.estado === "ok" ? <span className="text-green-400">OK</span> : (
                        <span className={f.estado === "error" ? "text-red-400" : "text-amber-400"}>{f.problemas.join(". ")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{f.fila.nombre}</td>
                    <td className="px-3 py-2">{f.fila.telefono}</td>
                    <td className="px-3 py-2">{f.fila.email}</td>
                    <td className="px-3 py-2">{f.fila.interes}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{dinero(f.fila.monto, f.fila.moneda)}</td>
                    {vendedores.length > 0 && <td className="px-3 py-2">{f.vendedorTexto || "(vos)"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
