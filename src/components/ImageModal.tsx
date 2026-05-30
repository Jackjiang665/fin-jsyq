"use client"

import { useState } from "react"

interface ImageModalProps {
  src: string
  alt: string
}

export default function ImageModal({ src, alt }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div className="max-w-4xl max-h-4xl p-4">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
            <div className="text-center text-white mt-2 text-sm">
              点击任意位置关闭
            </div>
          </div>
        </div>
      )}
    </>
  )
}
