import { ArrowDownRight, ExternalLink, Instagram, Play, Radio, Ticket, Youtube } from "lucide-react";

const members = [
  ["01", "Agnieszka “Dolores” Karchut", "Vocal"],
  ["02", "Krzysztof Wyżgoł", "Gitara"],
  ["03", "Michał Malec", "Bas"],
  ["04", "Kamil Szczepański", "Perkusja"],
];

const events = [
  { date: "22.08.2026", title: "Rock pod drzewem vol. 6", place: "Gliwice · Dworcowa 52", status: "ARCHIWUM" },
  { date: "09.08.2025", title: "Rock pod drzewem vol. 5", place: "Gliwice · Dworcowa 52", status: "ARCHIWUM" },
  { date: "17.01.2025", title: "The Tree & Bad Impression · WOŚP", place: "Gliwice · Klub Powstańcza", status: "ARCHIWUM" },
];

export default function TheTreePage() {
  return (
    <main className="min-h-screen bg-[#090909] text-[#eeeae3] selection:bg-[#d5b26a] selection:text-black">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090909]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" className="font-black tracking-[-0.08em] text-2xl">THE<span className="text-[#d5b26a]">TREE</span></a>
          <div className="hidden gap-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 md:flex">
            <a href="#story" className="hover:text-white">Historia</a><a href="#music" className="hover:text-white">Muzyka</a><a href="#live" className="hover:text-white">Live</a><a href="#band" className="hover:text-white">Skład</a><a href="#contact" className="hover:text-white">Kontakt</a>
          </div>
          <a href="#contact" className="border border-[#d5b26a]/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5b26a] transition hover:bg-[#d5b26a] hover:text-black">Booking</a>
        </div>
      </nav>

      <section id="top" className="relative flex min-h-[92vh] items-end overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(213,178,106,.18),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,.06),transparent_25%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:80px_80px]" />
        <div className="absolute right-[-12vw] top-[12vh] h-[65vw] w-[65vw] rounded-full border border-[#d5b26a]/20" />
        <div className="absolute right-[2vw] top-[24vh] h-[40vw] w-[40vw] rounded-full border border-white/10" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-36 lg:px-8 lg:pb-24">
          <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.42em] text-[#d5b26a]">Gliwice · Poland · since 2014</p>
          <h1 className="max-w-5xl text-[18vw] font-black leading-[.72] tracking-[-0.09em] sm:text-[15vw] lg:text-[11rem]">THE<br/><span className="ml-[9vw] text-white/20">TREE</span></h1>
          <div className="mt-12 flex max-w-2xl flex-col gap-6 md:ml-[18vw] md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-lg leading-8 text-white/55">Ekspresyjny rock. Gitary, puls i głos, który nie potrzebuje pozwolenia. Zespół z Gliwic, który najlepiej brzmi wtedy, gdy scena jest już gorąca.</p>
            <a href="#music" className="group flex w-fit items-center gap-3 border-b border-[#d5b26a]/60 pb-3 text-xs font-bold uppercase tracking-[.2em] text-[#d5b26a]">Posłuchaj <ArrowDownRight size={17} className="transition group-hover:translate-x-1 group-hover:translate-y-1"/></a>
          </div>
        </div>
      </section>

      <section id="story" className="mx-auto grid max-w-7xl gap-14 px-5 py-28 lg:grid-cols-[.7fr_1.3fr] lg:px-8 lg:py-36">
        <div><p className="text-[10px] font-bold uppercase tracking-[.35em] text-[#d5b26a]">01 / Historia</p><h2 className="mt-5 text-5xl font-black tracking-[-.05em] lg:text-7xl">Z miasta.<br/>Na scenę.</h2></div>
        <div className="max-w-3xl text-xl leading-9 text-white/60"><p>The Tree pochodzi z Gliwic. Obecny skład wyklarował się na początku 2014 roku. Muzycznie zespół porusza się w szeroko rozumianym rocku — od psychodelii i punk rocka po ska.</p><p className="mt-7">Przez lata grania najważniejsza pozostała energia koncertu. To zespół, który nie traktuje sceny jak dekoracji.</p><div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 text-sm"><div><strong className="block text-3xl text-white">2014</strong><span className="text-white/40">początek obecnego składu</span></div><div><strong className="block text-3xl text-white">10+</strong><span className="text-white/40">lat na scenie</span></div></div></div>
      </section>

      <section id="music" className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-36">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.35em] text-[#d5b26a]">02 / Muzyka</p><h2 className="mt-5 text-6xl font-black tracking-[-.06em] lg:text-8xl">BRIGHT<br/><span className="text-white/20">SIDE</span></h2></div><p className="max-w-sm text-sm leading-7 text-white/45">EP wydana w 2018 roku. Punkt odniesienia dla studyjnej historii The Tree.</p></div>
          <div className="mt-16 flex flex-col items-start justify-between gap-8 border-y border-white/10 py-8 md:flex-row md:items-center"><div className="flex items-center gap-5"><div className="grid h-14 w-14 place-items-center rounded-full border border-[#d5b26a]/60"><Play size={17} fill="currentColor"/></div><div><p className="font-bold">The Tree — Bright Side</p><p className="text-xs uppercase tracking-[.18em] text-white/35">EP · 2018</p></div></div><a href="https://www.youtube.com/channel/UCB-Cw-hsDmMtYM3bHGVWQ3A" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#d5b26a]">YouTube <ExternalLink size={14}/></a></div>
        </div>
      </section>

      <section id="live" className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-36">
        <div className="flex items-end justify-between border-b border-white/10 pb-8"><div><p className="text-[10px] font-bold uppercase tracking-[.35em] text-[#d5b26a]">03 / Live</p><h2 className="mt-5 text-6xl font-black tracking-[-.06em] lg:text-8xl">NA ŻYWO.</h2></div><Radio className="hidden text-[#d5b26a] md:block" size={34}/></div>
        <div>{events.map((event) => <div key={event.date} className="group grid gap-4 border-b border-white/10 py-7 transition hover:bg-white/[.025] md:grid-cols-[150px_1fr_180px] md:items-center"><span className="font-mono text-sm text-[#d5b26a]">{event.date}</span><div><h3 className="text-xl font-bold tracking-tight">{event.title}</h3><p className="mt-1 text-sm text-white/40">{event.place}</p></div><span className="text-right text-[10px] font-bold tracking-[.2em] text-white/25">{event.status}</span></div>)}</div>
        <div className="mt-12 border border-[#d5b26a]/25 bg-[#0d0d0d] p-7 md:flex md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#d5b26a]">Rock pod drzewem</p><p className="mt-2 text-white/50">Autorski plenerowy cykl koncertów tworzony przez The Tree i przyjaciół.</p></div><Ticket className="mt-5 text-white/20 md:mt-0" size={30}/></div>
      </section>

      <section id="band" className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-36"><p className="text-[10px] font-bold uppercase tracking-[.35em] text-[#d5b26a]">04 / Skład</p><div className="mt-12 grid gap-px bg-white/10 md:grid-cols-2">{members.map(([num,name,role]) => <div key={num} className="bg-[#0d0d0d] p-7 transition hover:bg-white/[.03] md:p-10"><span className="font-mono text-xs text-[#d5b26a]">{num}</span><h3 className="mt-14 text-2xl font-bold tracking-tight">{name}</h3><p className="mt-2 text-xs uppercase tracking-[.2em] text-white/35">{role}</p></div>)}</div></div>
      </section>

      <footer id="contact" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"><div className="grid gap-16 lg:grid-cols-[1fr_.6fr]"><div><p className="text-[10px] font-bold uppercase tracking-[.35em] text-[#d5b26a]">05 / Kontakt</p><h2 className="mt-5 max-w-3xl text-6xl font-black tracking-[-.07em] lg:text-8xl">BOOK<br/><span className="text-white/20">THE TREE.</span></h2><p className="mt-8 max-w-md text-white/45">Koncerty, festiwale, wydarzenia i współpraca. Dane bookingowe można uzupełnić bezpośrednio w builderze.</p></div><div className="flex flex-col justify-end gap-5"><a href="https://www.facebook.com/thetreeofficial" target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-white/10 pb-5 text-sm font-bold uppercase tracking-[.16em]">Facebook <ExternalLink size={16}/></a><a href="https://www.youtube.com/channel/UCB-Cw-hsDmMtYM3bHGVWQ3A" target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-white/10 pb-5 text-sm font-bold uppercase tracking-[.16em]">YouTube <Youtube size={17}/></a><div className="flex gap-4 pt-4 text-white/30"><Instagram size={18}/><span className="text-[10px] uppercase tracking-[.2em]">The Tree · Gliwice</span></div></div></div><div className="mt-24 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[.18em] text-white/25 md:flex-row"><span>© The Tree</span><span>Gliwice · Poland</span><span>Built with Gastro Growth Agent Builder</span></div></footer>
    </main>
  );
}
