'use client'

import React from 'react'
import Link from 'next/link'
import { Cpu, HardDrive, Database, Wifi, ShieldCheck, Download, Camera, Lock } from 'lucide-react'
import PublicNavbar from '@/components/shell/PublicNavbar'

export default function SpecsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] font-sans selection:bg-[#06B6D4] selection:text-black">
      <PublicNavbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-[#06B6D4]/20 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Cpu size={14} />
            <span>Industrial Hardware & Node Specifications</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white italic">
            NOXIS HUB WORKSTATION SPECS
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
            Technical requirements and architectural specifications for deploying local encrypted factory nodes and companion Android devices.
          </p>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Workstation PC Specs */}
          <div className="bg-[#0F141C] border border-[#06B6D4]/30 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#06B6D4] border-b border-white/10 pb-3">
              <HardDrive size={18} />
              <h2 className="text-base font-black uppercase text-white tracking-wider">Local Workstation PC (Min Specs)</h2>
            </div>
            <ul className="space-y-3 text-xs text-gray-300 font-mono">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">OS:</span>
                <span className="text-white font-bold">Windows 10 / 11 (64-bit)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Processor:</span>
                <span className="text-white font-bold">Intel Core i3 / AMD Ryzen 3 (2.0GHz+)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">RAM:</span>
                <span className="text-white font-bold">4 GB RAM (8 GB Recommended for CCTV AI)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Storage:</span>
                <span className="text-white font-bold">500 MB SSD (Local SQLite DB Storage)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Network:</span>
                <span className="text-white font-bold">Local Wi-Fi Router / 100Mbps Ethernet</span>
              </li>
            </ul>
          </div>

          {/* Android Companion Devices */}
          <div className="bg-[#0F141C] border border-[#06B6D4]/30 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#06B6D4] border-b border-white/10 pb-3">
              <Wifi size={18} />
              <h2 className="text-base font-black uppercase text-white tracking-wider">Floor Companion Android Devices</h2>
            </div>
            <ul className="space-y-3 text-xs text-gray-300 font-mono">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">OS Version:</span>
                <span className="text-white font-bold">Android 8.0+ (Oreo or newer)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Pairing Method:</span>
                <span className="text-white font-bold">QR Code Local Subnet Scanning</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Offline Logging:</span>
                <span className="text-white font-bold">Local Queue Storage (Zero Internet)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Camera / Scanner:</span>
                <span className="text-white font-bold">Autofocus Camera for Barcode Scanning</span>
              </li>
            </ul>
          </div>

          {/* CCTV & RTSP Cameras */}
          <div className="bg-[#0F141C] border border-[#06B6D4]/30 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#06B6D4] border-b border-white/10 pb-3">
              <Camera size={18} />
              <h2 className="text-base font-black uppercase text-white tracking-wider">CCTV & IP Camera Compatibility</h2>
            </div>
            <ul className="space-y-3 text-xs text-gray-300 font-mono">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Protocols:</span>
                <span className="text-white font-bold">RTSP / ONVIF (Port 554 / 80)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Supported Brands:</span>
                <span className="text-white font-bold">Hikvision, Imou, Dahua, Generic RTSP</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Processing:</span>
                <span className="text-white font-bold">100% Local Motion & Face Matching AI</span>
              </li>
            </ul>
          </div>

          {/* Database Encryption & FileMorph */}
          <div className="bg-[#0F141C] border border-[#06B6D4]/30 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#06B6D4] border-b border-white/10 pb-3">
              <Lock size={18} />
              <h2 className="text-base font-black uppercase text-white tracking-wider">Security & Encryption Core</h2>
            </div>
            <ul className="space-y-3 text-xs text-gray-300 font-mono">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Database Journal:</span>
                <span className="text-white font-bold">SQLite WAL Mode (AES-256)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">FileMorph Engine:</span>
                <span className="text-white font-bold">Client-Side WebAssembly (In-Memory)</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Governance:</span>
                <span className="text-white font-bold">Double-entry audit log cryptographic hashes</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 bg-[#0F141C] border border-[#06B6D4]/40 rounded-lg text-center space-y-4">
          <h3 className="text-xl font-black uppercase tracking-wider text-white">Ready to Deploy Noxis Node?</h3>
          <p className="text-xs text-gray-400 max-w-xl mx-auto">
            Deploy your local factory workstation in under 3 minutes with zero cloud setup required.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/download"
              className="px-6 py-3 bg-[#06B6D4] hover:bg-[#08EBF6] text-black text-xs font-black uppercase tracking-widest rounded no-underline flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <Download size={14} />
              <span>Download Node Setup (.exe)</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#06B6D4]/20 bg-[#07090D] py-8 text-center text-xs text-gray-500 font-mono">
        © 2026 Noxis Hub. Built for extreme performance.
      </footer>
    </div>
  )
}
