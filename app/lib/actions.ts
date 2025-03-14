"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  date: z.string(),
  customerId: z.string(),
  amount: z.number(),
  status: z.enum(["pending", "paid"]),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (errors) {
    console.log(errors);
  }
  // 清除缓存 让invoices页面重新获取页面数据
  revalidatePath("/dashboard/invoices");
  // 重定向
  redirect("/dashboard/invoices");
};

export const updateInvoice = async (id: string, formData: FormData) => {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;
  } catch (errors) {
    console.log(errors);
  }

  // 清除缓存 让invoices页面重新获取页面数据
  revalidatePath("/dashboard/invoices");
  // 重定向
  redirect("/dashboard/invoices");
};

export const deleteInvoice = async (id: string) => {
  throw new Error("something wrong");
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  // 清除缓存 让invoices页面重新获取页面数据
  revalidatePath("/dashboard/invoices");
};
