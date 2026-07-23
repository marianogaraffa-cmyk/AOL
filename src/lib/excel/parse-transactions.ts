import ExcelJS from "exceljs";

export type ParsedTransactionRow = {
  rowNumber: number;
  instructor: string;
  category: string;
  type: "ingreso" | "egreso";
  amount: number;
};

export type ParseResult = {
  rows: ParsedTransactionRow[];
  errors: string[];
};

const HEADER_ALIASES: Record<string, keyof ParsedTransactionRow | "type" | "amount"> = {
  instructor: "instructor",
  categoria: "category",
  "categoría": "category",
  tipo: "type",
  monto: "amount",
  importe: "amount",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export async function parseTransactionsWorkbook(buffer: ArrayBuffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { rows: [], errors: ["El archivo no tiene hojas."] };
  }

  const headerRow = sheet.getRow(1);
  const columnIndex: Partial<Record<"instructor" | "category" | "type" | "amount", number>> = {};

  headerRow.eachCell((cell, colNumber) => {
    const key = HEADER_ALIASES[normalizeHeader(cell.value)];
    if (key) columnIndex[key as keyof typeof columnIndex] = colNumber;
  });

  const missing = (["instructor", "category", "type", "amount"] as const).filter(
    (key) => !columnIndex[key],
  );
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        `Faltan columnas requeridas: ${missing.join(", ")}. Encabezados esperados: Instructor, Categoria, Tipo, Monto.`,
      ],
    };
  }

  const rows: ParsedTransactionRow[] = [];
  const errors: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const instructor = String(row.getCell(columnIndex.instructor!).value ?? "").trim();
    const category = String(row.getCell(columnIndex.category!).value ?? "").trim();
    const typeRaw = normalizeHeader(row.getCell(columnIndex.type!).value);
    const amountCell = row.getCell(columnIndex.amount!).value;

    if (!instructor && !category && !amountCell) return; // fila vacía

    if (!instructor || !category) {
      errors.push(`Fila ${rowNumber}: falta instructor o categoría.`);
      return;
    }

    if (typeRaw !== "ingreso" && typeRaw !== "egreso") {
      errors.push(`Fila ${rowNumber}: tipo inválido ("${typeRaw}"), debe ser "ingreso" o "egreso".`);
      return;
    }

    const amount = typeof amountCell === "number" ? amountCell : Number(amountCell);
    if (!Number.isFinite(amount)) {
      errors.push(`Fila ${rowNumber}: monto inválido.`);
      return;
    }

    rows.push({ rowNumber, instructor, category, type: typeRaw, amount });
  });

  return { rows, errors };
}
