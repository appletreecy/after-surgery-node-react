import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { RecordCreateSchema, RecordUpdateSchema } from '../schemas/record';


const router = Router();
router.use(requireAuth);


router.get('/', async (req, res) => {
    const { from, to, q, page = '1', pageSize = '20' } = req.query as any;
    const userId = req.user!.id;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);


    const where: any = { userId };
    if (from || to) {
        where.surgeryDate = {};
        if (from) where.surgeryDate.gte = new Date(from);
        if (to) where.surgeryDate.lte = new Date(to);
    }
    if (q) {
        where.OR = [
            { patientName: { contains: q } },
            { procedure: { contains: q } },
            { doctor: { contains: q } },
            { department: { contains: q } },
        ];
    }


    const [total, items] = await Promise.all([
        prisma.afterSurgeryRecord.count({ where }),
        prisma.afterSurgeryRecord.findMany({ where, orderBy: { surgeryDate: 'desc' }, skip, take }),
    ]);
    res.json({ total, items });
});


router.post('/', async (req, res) => {
    const parsed = RecordCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const data = parsed.data;
    const item = await prisma.afterSurgeryRecord.create({
        data: {
            userId: req.user!.id,
            surgeryDate: new Date(data.surgeryDate),
            patientName: data.patientName,
            procedure: data.procedure,
            doctor: data.doctor,
            department: data.department,
            notes: data.notes,
            outcome: data.outcome,
        },
    });
    res.status(201).json(item);
});


router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = RecordUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const data = parsed.data;


// Ensure record belongs to user
    const existing = await prisma.afterSurgeryRecord.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });


    const item = await prisma.afterSurgeryRecord.update({
        where: { id },
        data: {
            ...(data.surgeryDate ? { surgeryDate: new Date(data.surgeryDate) } : {}),
            ...(data.patientName ? { patientName: data.patientName } : {}),
            ...(data.procedure ? { procedure: data.procedure } : {}),
            ...(data.doctor ? { doctor: data.doctor } : {}),
            ...(data.department ? { department: data.department } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
            ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
        },
    });
    res.json(item);
});


router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.afterSurgeryRecord.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.afterSurgeryRecord.delete({ where: { id } });
    res.json({ ok: true });
});


export default router;