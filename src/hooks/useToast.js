// FIX BUG #2: ganti implementasi lokal dengan re-export dari ToastContext
// File ini tetap ada agar semua import '@/hooks/useToast' tidak perlu diubah.
export { useToast } from '@/context/ToastContext'
