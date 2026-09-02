import Swal from 'sweetalert2';

export const themeSwal = Swal.mixin({
  customClass: {
    popup: 'bg-card border border-border text-foreground rounded-2xl shadow-xl p-6 font-sans',
    title: 'text-base font-extrabold text-foreground mb-1',
    htmlContainer: 'text-xs text-muted-foreground leading-relaxed',
    confirmButton:
      'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs mx-1',
    cancelButton:
      'bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-border mx-1',
    denyButton:
      'bg-destructive text-white hover:bg-destructive/90 px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs mx-1',
    actions: 'flex items-center justify-end gap-2 mt-4',
  },
  buttonsStyling: false,
});

/**
 * Modern Theme-Matched Confirmation Alert Dialog
 */
export const confirmAlert = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  icon = 'warning',
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  confirmButtonVariant = 'destructive', // 'destructive' | 'primary'
}) => {
  const isDestructive = confirmButtonVariant === 'destructive';

  const result = await themeSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      popup: 'bg-card border border-border text-foreground rounded-2xl shadow-2xl p-6 font-sans',
      title: 'text-base font-extrabold text-foreground mb-1',
      htmlContainer: 'text-xs text-muted-foreground leading-relaxed',
      confirmButton: `${
        isDestructive
          ? 'bg-destructive text-white hover:bg-destructive/90'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      } px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-2xs mx-1`,
      cancelButton:
        'bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all border border-border mx-1',
      actions: 'flex items-center justify-end gap-2 mt-4',
    },
  });

  return result.isConfirmed;
};

/**
 * Toast / Status Alert using SweetAlert
 */
export const showAlert = ({
  title,
  text,
  icon = 'success', // 'success' | 'error' | 'warning' | 'info'
  timer = 3000,
}) => {
  return themeSwal.fire({
    title,
    text,
    icon,
    timer,
    showConfirmButton: false,
  });
};
