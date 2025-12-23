function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 text-sm text-slate-500 md:flex-row md:items-center md:px-6">
        <p className="font-display text-base font-semibold text-slate-700">
          Make wearables feel human.
        </p>
        <p>
          Data is synthetic for demo use. Always consult a healthcare professional for medical
          concerns.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
