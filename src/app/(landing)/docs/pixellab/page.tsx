import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Key, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import ApiImage from '@/assets/api.png'
import PixelApp from '@/assets/pixel-app.png'

export default function PixelLabDocsPage ()
{
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#ededed] selection:bg-[#00f5ff]/30">
      {/* Header */ }
      <header className="border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-widest text-white transition-colors hover:text-[#00f5ff]">
            PixelForge
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link href="/editor/sprites" className="text-sm font-medium text-[#8888aa] transition-colors hover:text-[#00f5ff]">Editor</Link>
            <Link href="/" className="text-sm font-medium text-[#8888aa] transition-colors hover:text-[#00f5ff]">Features</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Intro */ }
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 mb-6">
            <Sparkles size={ 14 } />
            <span>AI Integration</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            PixelLab <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#00f5ff]">Integration</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#8888aa]">
            Unleash the power of AI-driven pixel art directly within PixelForge.
            Connect your PixelLab account to generate high-quality sprites in seconds.
          </p>
        </div>

        {/* Steps */ }
        <div className="space-y-24">
          <section className="relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a2e] text-[#00f5ff] shadow-xl shadow-cyan-500/5">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h2 className="mb-4 text-2xl font-bold text-white">Create your PixelLab account</h2>
                <p className="text-[#8888aa] leading-relaxed">
                  To get started, you need a PixelLab.ai account. It's the leading platform for generating pixel art using artificial intelligence.
                </p>
                <div className="mt-8">
                  <a
                    href="https://www.pixellab.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0f] transition-all hover:scale-105 active:scale-95"
                  >
                    Go to PixelLab.ai
                    <ExternalLink size={ 16 } />
                  </a>
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00f5ff]/10 to-purple-500/10" />
                <div className="flex h-full w-full items-center justify-center text-[#444466]">
                  <Image src={ PixelApp } alt="PixelLab" className="w-full h-full object-cover opacity-50" />
                </div>
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:flex-row-reverse">
              <div className="lg:order-2">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a2e] text-[#00f5ff] shadow-xl shadow-cyan-500/5">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h2 className="mb-4 text-2xl font-bold text-white">Get your API Key</h2>
                <p className="text-[#8888aa] leading-relaxed">
                  Once inside PixelLab, go to your profile or API settings section.
                  Look for the <strong>"API Access"</strong> area and generate a new key.
                </p>
                <div className="mt-6 flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-200/70">
                  <Key size={ 16 } className="shrink-0 text-yellow-500" />
                  <p>Keep your API Key secret. Never share it or upload it to public repositories.</p>
                </div>
              </div>
              <div className="lg:order-1 relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl">
                <Image
                  src={ ApiImage }
                  alt="PixelLab API"
                  className="h-full w-full object-cover"
                  placeholder="blur"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a2e] text-[#00f5ff] shadow-xl shadow-cyan-500/5">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h2 className="mb-4 text-2xl font-bold text-white">Connect it in PixelForge</h2>
                <p className="text-[#8888aa] leading-relaxed">
                  Copy your API Key and paste it into the PixelForge settings. Your data is stored locally in your browser securely.
                  <strong> We do not store your keys on our servers.</strong>
                </p>
                <div className="mt-8">
                  <Link
                    href="/editor/sprites"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#00f5ff]/20 bg-[#00f5ff]/10 px-5 py-3 text-sm font-bold text-[#00f5ff] transition-all hover:bg-[#00f5ff]/20 active:scale-95"
                  >
                    Go to Editor
                    <Zap size={ 16 } />
                  </Link>
                </div>
              </div>
              <div className="relative rounded-2xl border border-white/10 bg-[#0f1115] p-8 shadow-2xl">
                <div className="mb-6 flex items-center gap-3">
                  <ShieldCheck size={ 24 } className="text-[#00f5ff]" />
                  <h3 className="text-lg font-bold text-white">Data Security</h3>
                </div>
                <ul className="space-y-4 text-sm text-[#8888aa]">
                  <li className="flex gap-3">
                    <div className="h-1.5 w-1.5 translate-y-2 shrink-0 rounded-full bg-[#00f5ff]" />
                    <p>Keys are stored in your browser's <code className="text-[#ededed] bg-white/5 px-1 rounded">localStorage</code>.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-1.5 w-1.5 translate-y-2 shrink-0 rounded-full bg-[#00f5ff]" />
                    <p>They are only sent to PixelLab to process your generation requests.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-1.5 w-1.5 translate-y-2 shrink-0 rounded-full bg-[#00f5ff]" />
                    <p>You can remove your key at any time from the settings.</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */ }
        <div className="mt-32 rounded-3xl border border-white/5 bg-gradient-to-b from-[#0f1115] to-[#0a0a0f] p-12 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white">Ready to create something amazing?</h2>
          <p className="mb-10 text-[#8888aa]">Start generating unique sprites with the power of PixelLab.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/editor/sprites"
              className="rounded-xl bg-[#00f5ff] px-8 py-4 text-sm font-extrabold text-[#0a0a0f] shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/40 active:scale-95"
            >
              Open Editor
            </Link>
            <a
              href="https://www.pixellab.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/10 active:scale-95"
            >
              Explore PixelLab
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 text-center">
        <p className="text-xs text-[#444466]">© 2026 PixelForge. Powered by PixelLab AI.</p>
      </footer>
    </div>
  )
}
