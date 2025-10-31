import { z } from 'zod';
export const RecordCreateSchema = z.object({
    surgeryDate: z.string(), // ISO string
    patientName: z.string().min(1),
    procedure: z.string().min(1),
    doctor: z.string().min(1),
    department: z.string().min(1),
    notes: z.string().optional(),
    outcome: z.string().optional(),
});
export const RecordUpdateSchema = RecordCreateSchema.partial();