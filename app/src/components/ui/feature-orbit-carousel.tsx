"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/*
 * Feature Orbit Carousel: a pinned product display. The active "orb" sits on the
 * left; changing feature swings it out over the top on a wide orbit while the
 * next one swings in from the other side. The two-weight title wipes out and
 * back in (thin line from the right, heavy line from the left), the detail card
 * and its coloured badge cross-fade, and a pastel arc behind the scene turns and
 * takes the feature's colour. The page scroll drives it: the section pins and
 * each stretch of scroll brings the next feature, endlessly both ways. Arrows,
 * thumbnails, the side pager, arrow keys and swipes jump too.
 */

export type Feature = {
  /** The thin first title line, e.g. "Centralised". */
  title: string
  /** The heavy second title line, e.g. "Notice feed". */
  subtitle: string
  /** Square art, ideally a transparent PNG/WebP/SVG. */
  image: string
  alt?: string
  /** Small line above the title. Defaults to "#n Core capability". */
  eyebrow?: string
  /** Two-line label under the thumbnail. Defaults to title + subtitle. */
  label?: string
  /** Who the capability is for. */
  audience: string
  /** Supporting context under the audience line. */
  context: string
  description: string
  saves: number
  capabilities: string[]
  /** Badge and band colour: hex or rgb(), so the band can morph between features. */
  accent: string
}

export type FeatureOrbitCarouselProps = {
  features: Feature[]
  /** Root height. A definite length: percentages collapse on a host page. */
  height?: string
  /** Optional photo behind the display. Washed by the theme background. */
  backdrop?: string
  /** Scroll on forever: past the last feature comes the first again, and up from the first, the last. */
  loop?: boolean
  onPreview?: (feature: Feature, index: number) => void
  onGetStarted?: (feature: Feature, index: number) => void
  onChange?: (index: number) => void
  className?: string
}

// #region carousel
export function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0
  return ((Math.round(i) % n) + n) % n
}

/** Which way to swing when jumping from one feature to another: the shorter way round. */
export function stepDirection(from: number, to: number, n: number): 1 | -1 {
  if (n <= 0) return 1
  const fwd = (((to - from) % n) + n) % n
  return fwd <= n - fwd ? 1 : -1
}

/** Scroll stretches in the section: one per feature change, plus one back round to the first when looping. */
export function scrollSteps(n: number, loop: boolean): number {
  return Math.max(0, loop ? n : n - 1)
}

/** The scroll stretch for feature `i` nearest the current one (when looping, feature 0 is also the last stretch). */
export function segmentFor(i: number, current: number, n: number, loop: boolean): number {
  return loop && i === 0 && current > n / 2 ? n : i
}

/** First thumbnail shown in the strip window, keeping the current one in view. */
export function stripStart(index: number, n: number, visible: number): number {
  if (n <= visible) return 0
  return Math.max(0, Math.min(index - 1, n - visible))
}

/** Title font size so a line of `chars` characters fits `width` px at `em` average glyph width. */
export function fitSize(chars: number, max: number, width: number, em: number): number {
  return Math.min(max, width / (Math.max(1, chars) * em))
}
/**
 * The pastel band: a thick stroke along the orbs' orbit circle, tapering at
 * both ends. Angles in degrees, screen space (0 = right, 90 = straight down).
 */
export function arcPath(a0: number, a1: number, cx: number, cy: number, r: number, w: number, steps = 48): string {
  const outer: string[] = []
  const inner: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.45)
    const c = Math.cos(a)
    const s = Math.sin(a)
    outer.push((cx + c * (r + h)).toFixed(1) + " " + (cy + s * (r + h)).toFixed(1))
    inner.push((cx + c * (r - h)).toFixed(1) + " " + (cy + s * (r - h)).toFixed(1))
  }
  return "M" + outer.join("L") + "L" + inner.reverse().join("L") + "Z"
}

/** Where the band rests for each feature, as [start, end] angles along the orbit. */
export const ARC_REST = [[50, 98], [46, 124], [60, 126], [40, 100]]
export function arcRest(index: number): number[] {
  return ARC_REST[((index % ARC_REST.length) + ARC_REST.length) % ARC_REST.length]
}

/** The band mid-swap: it stretches to trail between the outgoing and incoming orb. */
export const ARC_SWEEP = [38, 146]
// #endregion
// The orbs' orbit: its pivot sits above the canvas (the .foc-orbit transform-origin).
const ORBIT_X = 299
const ORBIT_Y = -450
const ORBIT_R = 650
const SCROLL_PER_FEATURE = 0.7 // stage heights of scroll per feature
const SWING = 50 // degrees the orb travels round the orbit's pivot
const ITEM = 118 // thumbnail pitch in canvas px
const VISIBLE = 4

const CSS =
  ".foc-trk{position:relative;width:100%}" +
  ".foc-root{position:sticky;top:0;overflow:hidden;width:100%;background:var(--color-bg);color:var(--color-text);" +
  "font-family:var(--font-display,ui-sans-serif,system-ui,sans-serif);container-type:inline-size;-webkit-tap-highlight-color:transparent}" +
  ".foc-root *{box-sizing:border-box}" +
  ".foc-bd{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none}" +
  ".foc-wash{position:absolute;inset:0;background:color-mix(in oklab,var(--color-bg) 38%,transparent);pointer-events:none}" +
  // multiply by the background: a no-op on a light theme, lights-off on a dark one
  ".foc-dim{position:absolute;inset:0;background:var(--color-bg);mix-blend-mode:multiply;opacity:.72;pointer-events:none}" +
  ".foc-root:focus-visible{outline:2px solid var(--color-accent);outline-offset:-4px}" +
  ".foc-canvas{position:absolute;left:50%;top:50%;width:960px;height:520px;transform:translate(-50%,-50%) scale(var(--foc-s,1));transform-origin:50% 50%}" +
  ".foc-arc{position:absolute;left:0;top:0;width:960px;height:520px;overflow:visible;pointer-events:none}" +
  ".foc-btn{appearance:none;border:0;background:none;color:inherit;font:inherit;padding:0;margin:0;cursor:pointer}" +
  ".foc-btn:focus-visible{outline:2px solid var(--color-accent);outline-offset:3px;border-radius:10px}" +
  ".foc-ico{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}" +
  ".foc-kicker{position:absolute;left:76px;top:32px;display:flex;align-items:baseline;gap:10px;margin:0;" +
  "font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}" +
  ".foc-kicker span{font-size:10.5px;font-weight:500;letter-spacing:.1em;color:var(--color-text-muted)}" +
  ".foc-pager{position:absolute;left:76px;top:172px;display:flex;flex-direction:column;align-items:center;gap:7px}" +
  ".foc-dot{width:14px;height:10px;display:grid;place-items:center}" +
  ".foc-dot i{display:block;width:3px;height:3px;border-radius:3px;background:var(--color-text);opacity:.45;transition:height .45s cubic-bezier(.3,.7,.2,1),opacity .3s}" +
  ".foc-dot[aria-current] i{height:22px;opacity:.9}" +
  ".foc-dot[aria-current]{height:26px}" +
  ".foc-dot{transition:height .45s cubic-bezier(.3,.7,.2,1)}" +
  ".foc-orbs{position:absolute;left:130px;top:82px;width:245px;height:245px;touch-action:pan-y}" +
  ".foc-orbit{position:absolute;inset:0;transform-origin:69% -217%;visibility:hidden;will-change:transform}" +
  ".foc-orbit>img{display:block;width:245px;height:245px;max-width:none;object-fit:contain;user-select:none;-webkit-user-drag:none;" +
  "filter:drop-shadow(0 16px 22px rgba(0,0,0,.45)) drop-shadow(0 3px 5px rgba(0,0,0,.3))}" +
  ".foc-head{position:absolute;left:388px;top:96px;width:330px;height:150px}" +
  ".foc-hd{position:absolute;inset:0;visibility:hidden}" +
  ".foc-eye{font-size:12.5px;font-weight:600;letter-spacing:.01em;margin:0 0 4px 2px;color:var(--color-text-muted)}" +
  ".foc-t1,.foc-t2{display:block;white-space:nowrap;line-height:1;text-transform:uppercase;margin:0}" +
  ".foc-t1{font-weight:200;letter-spacing:-.015em;margin-top:6px}" +
  ".foc-t2{font-weight:800;letter-spacing:-.025em;margin-top:6px;color:color-mix(in oklab,var(--color-text) 86%,transparent)}" +
  ".foc-acts{position:absolute;left:396px;top:280px;display:flex;gap:44px;font-size:12.5px;font-weight:500}" +
  ".foc-acts .foc-btn{display:flex;align-items:center;gap:9px;padding:4px 0}" +
  ".foc-acts .foc-ico{width:13px;height:13px}" +
  ".foc-acts .foc-fill{fill:currentColor;stroke:none}" +
  ".foc-card{position:absolute;left:722px;top:137px;width:223px;padding:18px 20px 20px;border-radius:20px;border:1.5px solid var(--color-border);" +
  "background:color-mix(in oklab,var(--color-bg-elevated) 78%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);" +
  "box-shadow:0 1px 0 color-mix(in oklab,var(--color-text) 6%,transparent) inset,0 18px 40px -24px rgba(0,0,0,.7)}" +
  ".foc-tabs{display:flex;justify-content:space-between;padding:0 6px 0 20px;font-size:12px;margin-bottom:20px}" +
  ".foc-tab{color:var(--color-text-muted);font-weight:500;padding:3px 0}" +
  ".foc-tab[aria-selected=true]{color:var(--color-text);font-weight:600}" +
  ".foc-bodies{display:grid}" +
  ".foc-body{grid-area:1/1;visibility:hidden}" +
  ".foc-rate{position:relative;height:62px;margin:0 0 14px 6px}" +
  ".foc-badge{position:absolute;left:0;top:0;width:46px;height:62px;border-radius:10px}" +
  ".foc-badge svg{position:absolute;left:17px;bottom:9px;width:12px;height:12px;fill:var(--color-bg);opacity:.8}" +
  ".foc-num{position:absolute;left:10px;top:4px;font-size:36px;font-weight:700;letter-spacing:-.04em;line-height:1;color:var(--color-bg)}" +
  ".foc-aud{font-size:19px;font-weight:600;letter-spacing:-.01em;margin:0}" +
  ".foc-ctx{font-size:10.5px;color:var(--color-text-muted);margin:3px 0 12px}" +
  ".foc-desc{font-size:12.5px;line-height:1.38;margin:0;min-height:52px;color:var(--color-text)}" +
  ".foc-ing{display:flex;flex-wrap:wrap;gap:5px;margin:0;padding:0;list-style:none;min-height:52px}" +
  ".foc-ing li{font-size:11px;padding:4px 9px;border-radius:99px;background:color-mix(in oklab,var(--color-text) 7%,transparent)}" +
  ".foc-react{display:flex;gap:12px;margin-top:20px}" +
  ".foc-save{display:flex;align-items:center;gap:8px;height:34px;padding:0 14px 0 10px;border-radius:99px;font-size:10.5px;" +
  "background:color-mix(in oklab,var(--color-text) 6%,transparent);transition:background .25s}" +
  ".foc-more{width:34px;height:34px;display:grid;place-items:center;border-radius:99px;background:color-mix(in oklab,var(--color-text) 6%,transparent)}" +
  ".foc-react .foc-ico{width:16px;height:16px}" +
  ".foc-react [aria-pressed=true] .foc-ico{fill:currentColor}" +
  ".foc-strip{position:absolute;left:130px;top:362px;width:550px;height:122px;display:flex;align-items:center}" +
  ".foc-arrow{width:36px;height:36px;display:grid;place-items:center;flex:none}" +
  ".foc-arrow svg{width:12px;height:16px;fill:currentColor}" +
  ".foc-win{position:relative;width:" + ITEM * VISIBLE + "px;height:122px;overflow:hidden;flex:none;margin:0 2px;" +
  "-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}" +
  ".foc-track{position:absolute;left:0;top:0;display:flex;transition:transform .6s cubic-bezier(.65,0,.35,1)}" +
  ".foc-th{width:" + ITEM + "px;height:122px;display:flex;justify-content:center;padding-top:3px}" +
  ".foc-th .foc-btn{width:80px;height:116px;border-radius:14px;display:flex;flex-direction:column;align-items:center;gap:7px;padding-top:9px;transition:background .45s}" +
  ".foc-th .foc-btn[aria-current]{background:color-mix(in oklab,var(--color-bg) 62%,transparent);box-shadow:0 10px 24px -16px rgba(0,0,0,.55)}" +
  ".foc-th img{width:56px;height:56px;max-width:none;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35));transition:transform .45s}" +
  ".foc-th .foc-btn[aria-current] img{transform:scale(1.06)}" +
  ".foc-th span{font-size:10px;line-height:1.25;text-align:center;font-weight:500;color:color-mix(in oklab,var(--color-text) 78%,transparent);max-width:78px}" +
  ".foc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@container (max-width:639px){" +
  ".foc-canvas{position:relative;left:auto;top:auto;width:100%;height:auto;transform:none;display:flex;flex-direction:column;align-items:center;padding:14px 16px 18px}" +
  ".foc-arc{width:200%;height:auto;left:-60%;top:-30px}" +
  ".foc-kicker{position:relative;left:auto;top:auto;align-self:flex-start;margin-bottom:2px}" +
  ".foc-pager{left:14px;top:150px}" +
  ".foc-orbs{position:relative;left:auto;top:auto;width:min(46vw,25svh);height:min(46vw,25svh);margin-top:0}" +
  ".foc-orbit>img{width:100%;height:100%}" +
  ".foc-head{position:relative;left:auto;top:auto;width:100%;height:120px;margin-top:6px}" +
  ".foc-hd{text-align:center;transform:scale(.78);transform-origin:50% 0}" +
  ".foc-acts{position:relative;left:auto;top:auto;margin-top:4px}" +
  ".foc-card{position:relative;left:auto;top:auto;width:100%;max-width:420px;margin-top:10px;padding:14px 16px 16px}" +
  ".foc-tabs{margin-bottom:12px}" +
  ".foc-rate{height:54px;margin-bottom:10px}" +
  ".foc-badge{height:54px}" +
  ".foc-desc,.foc-ing{min-height:0}" +
  ".foc-react{margin-top:12px}" +
  // phone: the pinned stage has to fit one screen; the pager, swipes and scroll cover the strip
  ".foc-strip{display:none}" +
  "}" +
  "@media (prefers-reduced-motion:reduce){.foc-track,.foc-dot,.foc-dot i,.foc-th .foc-btn,.foc-th img,.foc-save{transition:none}}"

const HIDE_1 = "inset(0% 0% 0% 100%)" // thin line: wipes in from the right
const HIDE_2 = "inset(0% 100% 0% 0%)" // heavy line: wipes in from the left
const SHOW = "inset(0% 0% 0% 0%)"

const Icon = {
  play: <svg className="foc-ico foc-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5v17l14-8.5z" /></svg>,
  order: <svg className="foc-ico foc-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 3 15h18zM3 18h18v2.5H3z" /></svg>,
  save: <svg className="foc-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1V21L12 16.8 5.5 21V4.5a1 1 0 0 1 1-1z" /></svg>,
  more: <svg className="foc-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>,
}

export function FeatureOrbitCarousel({
  features,
  height = "100svh",
  backdrop,
  loop = true,
  onPreview,
  onGetStarted,
  onChange,
  className,
}: FeatureOrbitCarouselProps) {
  const n = features.length
  const [index, setIndex] = useState(0)
  const [tab, setTab] = useState("overview")
  const [saved, setSaved] = useState({} as Record<number, boolean>)

  const trackRef = useRef(null as HTMLDivElement | null)
  const rootRef = useRef(null as HTMLDivElement | null)
  const stRef = useRef(null as ScrollTrigger | null)
  const segRef = useRef(0)
  const indexRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const orbits = useRef([] as (HTMLDivElement | null)[])
  const heads = useRef([] as (HTMLDivElement | null)[])
  const bodies = useRef([] as (HTMLDivElement | null)[])
  const arcRef = useRef(null as SVGPathElement | null)
  const arc = useRef({ a0: 0, a1: 0 })
  const shown = useRef(-1)
  const dirRef = useRef(1 as 1 | -1)
  const tlRef = useRef(null as gsap.core.Timeline | null)
  const reducedRef = useRef(false)
  const swipe = useRef(null as { x: number; y: number } | null)

  // Fit the 960 x 520 design canvas to the root. Measured on resize only.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const fit = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      el.style.setProperty("--foc-s", String(Math.min(w / 960, h / 520, 1.6)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => (reducedRef.current = mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // The swap. Every feature is in the DOM; GSAP only moves the outgoing and incoming ones.
  useLayoutEffect(() => {
    const from = shown.current
    const to = index
    const parts = (i: number) => {
      const head = heads.current[i]
      return {
        orbit: orbits.current[i],
        head,
        eye: head && head.querySelector(".foc-eye"),
        t1: head && head.querySelector(".foc-t1"),
        t2: head && head.querySelector(".foc-t2"),
        body: bodies.current[i],
      }
    }
    // Writes the band's path only; no layout is read.
    const drawArc = () => arcRef.current?.setAttribute("d", arcPath(arc.current.a0, arc.current.a1, ORBIT_X, ORBIT_Y, ORBIT_R, 118))
    const rest = arcRest(to)
    const tint = features[to] ? features[to].accent : "transparent"
    if (tlRef.current) tlRef.current.progress(1).kill()
    const b = parts(to)
    if (from === -1 || from === to || reducedRef.current) {
      for (let i = 0; i < n; i++) if (i !== to) {
        const p = parts(i)
        gsap.set([p.orbit, p.head, p.body], { autoAlpha: 0 })
      }
      gsap.set([b.orbit, b.head, b.body, b.eye], { autoAlpha: 1, rotation: 0, y: 0 })
      gsap.set(b.t1, { clipPath: SHOW })
      gsap.set(b.t2, { clipPath: SHOW })
      arc.current.a0 = rest[0]
      arc.current.a1 = rest[1]
      drawArc()
      if (arcRef.current) gsap.set(arcRef.current, { fill: tint })
      shown.current = to
      return
    }
    const a = parts(from)
    const d = dirRef.current
    const tl = gsap.timeline({ onComplete: () => { tlRef.current = null } })
    tlRef.current = tl
    // orb: out over the top on the orbit, the next one swings in from the far side
    tl.to(a.orbit, { rotation: SWING * d, duration: 0.62, ease: "power2.in" }, 0)
      .set(a.orbit, { autoAlpha: 0, rotation: 0 }, 0.62)
      .fromTo(b.orbit, { autoAlpha: 1, rotation: -SWING * d }, { rotation: 0, duration: 0.95, ease: "power3.out" }, 0.3)
    // title: thin line clips away to the right, heavy line to the left, then the next wipes in
    tl.to(a.t1, { clipPath: HIDE_1, duration: 0.42, ease: "power2.in" }, 0)
      .to(a.t2, { clipPath: HIDE_2, duration: 0.42, ease: "power2.in" }, 0.06)
      .to(a.eye, { autoAlpha: 0, duration: 0.25 }, 0)
      .set(a.head, { autoAlpha: 0 }, 0.5)
      .set(b.head, { autoAlpha: 1 }, 0.5)
      .fromTo(b.eye, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.55)
      .fromTo(b.t1, { clipPath: HIDE_1 }, { clipPath: SHOW, duration: 0.7, ease: "power3.out" }, 0.55)
      .fromTo(b.t2, { clipPath: HIDE_2 }, { clipPath: SHOW, duration: 0.7, ease: "power3.out" }, 0.62)
    // card: cross-fade, the incoming rows rise in turn
    tl.to(a.body, { autoAlpha: 0, y: -6, duration: 0.3, ease: "power1.in" }, 0.05)
      .set(b.body, { autoAlpha: 1, y: 0 }, 0.4)
    if (b.body) tl.fromTo(b.body.children, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }, 0.4)
    // the band stretches along the orbit with the orbs, then settles into the next feature's span, morphing colour
    tl.to(arc.current, { a0: ARC_SWEEP[0], a1: ARC_SWEEP[1], duration: 0.6, ease: "power2.inOut", onUpdate: drawArc }, 0)
      .to(arc.current, { a0: rest[0], a1: rest[1], duration: 0.85, ease: "power3.out", onUpdate: drawArc }, 0.6)
    if (arcRef.current) tl.to(arcRef.current, { fill: tint, duration: 1.1, ease: "power1.inOut" }, 0.1)
    shown.current = to
  }, [index, n, features])

  useEffect(() => () => { tlRef.current?.kill() }, [])

  const select = (next: number, dir: 1 | -1) => {
    if (next === indexRef.current) return
    dirRef.current = dir
    indexRef.current = next
    setIndex(next)
    onChangeRef.current?.(next)
  }

  // The page scroll drives the feature: the stage pins, one stretch of scroll per feature, snapping between them.
  const steps = scrollSteps(n, loop)
  useEffect(() => {
    const track = trackRef.current
    if (!track || steps < 1) return
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      snap: { snapTo: 1 / steps, duration: { min: 0.3, max: 0.8 }, delay: 0.08, ease: "power2.inOut" },
      onUpdate: (self) => {
        // Looping: the last stretch shows the first feature, so jump back to the top unseen.
        if (loop && self.progress >= 1 && self.direction > 0) {
          segRef.current = 0
          self.scroll(self.start + 1)
          select(0, 1)
          return
        }
        const seg = Math.round(self.progress * steps)
        if (seg === segRef.current) return
        const dir = seg > segRef.current ? 1 : -1
        segRef.current = seg
        select(wrapIndex(seg, n), dir)
      },
    })
    // At the very top no scroll is left to fire onUpdate, so scrolling up there wraps round to the last feature.
    // Deferred a frame so the browser's own wheel scroll has landed first.
    let raf = 0
    const onWheel = (e: WheelEvent) => {
      const y = trigger.scroll()
      if (!loop || e.deltaY >= 0 || y < trigger.start - 1 || y > trigger.start + 1) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        segRef.current = n - 1
        trigger.scroll(trigger.start + ((trigger.end - trigger.start) * (n - 1)) / steps)
        select(n - 1, -1)
      })
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    stRef.current = trigger
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("wheel", onWheel)
      trigger.kill()
      stRef.current = null
    }
  }, [steps, loop, n])

  // Buttons, keys and swipes jump to a feature and move the scroll to its stretch, so the two stay in step.
  const go = (to: number, dir?: 1 | -1) => {
    if (n < 2) return
    const next = wrapIndex(to, n)
    if (next === index) return
    const st = stRef.current
    const y = st ? st.scroll() : 0
    if (st && y >= st.start - 1 && y <= st.end + 1) {
      const seg = segmentFor(next, segRef.current, n, loop)
      segRef.current = seg
      st.scroll(st.start + ((st.end - st.start) * seg) / steps)
    }
    select(next, dir ?? stepDirection(index, next, n))
  }
  const step = (d: 1 | -1) => go(index + d, d)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1) }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1) }
  }
  const onPointerDown = (e: React.PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY } }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.4) step(dx < 0 ? 1 : -1)
  }

  const start = stripStart(index, n, VISIBLE)
  const feature = features[index]

  return (
    <div ref={trackRef} className={"foc-trk" + (className ? " " + className : "")} style={{ height: "calc(" + height + " * " + (1 + steps * SCROLL_PER_FEATURE) + ")" }}>
    <div
      ref={rootRef}
      className="foc-root"
      style={{ height }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product features"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <style>{CSS}</style>
      {backdrop ? <img className="foc-bd" src={backdrop} alt="" width={1200} height={900} /> : null}
      {backdrop ? <div className="foc-dim" /> : null}
      {backdrop ? <div className="foc-wash" /> : null}

      <div className="foc-canvas">
        <svg className="foc-arc" viewBox="0 0 960 520" aria-hidden="true">
          <path ref={arcRef} style={{ opacity: 0.34 }} />
        </svg>

        <p className="foc-kicker">
          Features <span>Product capabilities</span>
        </p>

        <div className="foc-pager" role="tablist" aria-label="Choose a feature">
          {features.map((f, i) => (
            <button key={i} type="button" role="tab" className="foc-btn foc-dot" aria-selected={i === index}
              aria-current={i === index ? "true" : undefined} aria-label={f.title + " " + f.subtitle} onClick={() => go(i)}>
              <i />
            </button>
          ))}
        </div>

        <div className="foc-orbs" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipe.current = null)}>
          {features.map((f, i) => (
            <div key={i} ref={(el) => { orbits.current[i] = el }} className="foc-orbit" aria-hidden={i !== index}>
              <img src={f.image} alt={f.alt ?? f.title + " " + f.subtitle} width={245} height={245} draggable={false} />
            </div>
          ))}
        </div>

        <div className="foc-head" aria-live="polite">
          {features.map((f, i) => (
            <div key={i} ref={(el) => { heads.current[i] = el }} className="foc-hd" aria-hidden={i !== index}>
              <p className="foc-eye">{f.eyebrow ?? "#" + (i + 1) + " Core capability"}</p>
              <h2 style={{ margin: 0, font: "inherit" }}>
                <span className="foc-t1" style={{ fontSize: fitSize(f.title.length, 56, 330, 0.56) + "px" }}>{f.title}</span>
                <span className="foc-t2" style={{ fontSize: fitSize(f.subtitle.length, 62, 320, 0.64) + "px" }}>{f.subtitle}</span>
              </h2>
            </div>
          ))}
        </div>

        <div className="foc-acts">
          <button type="button" className="foc-btn" onClick={() => feature && onPreview?.(feature, index)}>{Icon.play}See it in action</button>
          <button type="button" className="foc-btn" onClick={() => feature && onGetStarted?.(feature, index)}>{Icon.order}Get started</button>
        </div>

        <div className="foc-card">
          <div className="foc-tabs" role="tablist" aria-label="Feature details">
            {["overview", "capabilities"].map((t) => (
              <button key={t} type="button" role="tab" className="foc-btn foc-tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {t === "overview" ? "Overview" : "Capabilities"}
              </button>
            ))}
          </div>
          <div className="foc-bodies">
            {features.map((f, i) => (
              <div key={i} ref={(el) => { bodies.current[i] = el }} className="foc-body" aria-hidden={i !== index}>
                <div className="foc-rate">
                  <div className="foc-badge" style={{ background: f.accent }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
                  </div>
                  <span className="foc-num" aria-label={"Feature " + (i + 1) + " of " + n}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="foc-aud">{f.audience}</p>
                <p className="foc-ctx">{f.context}</p>
                {tab === "overview" || !f.capabilities?.length ? (
                  <p className="foc-desc">{f.description}</p>
                ) : (
                  <ul className="foc-ing">{f.capabilities.map((x) => <li key={x}>{x}</li>)}</ul>
                )}
                <div className="foc-react">
                  <button type="button" className="foc-btn foc-save" aria-pressed={!!saved[i]} tabIndex={i === index ? 0 : -1}
                    onClick={() => setSaved((s) => ({ ...s, [i]: !s[i] }))}>
                    {Icon.save}{f.saves.toLocaleString("en-US")} saves
                  </button>
                  <button type="button" className="foc-btn foc-more" aria-label={"Explore " + f.title + " " + f.subtitle} tabIndex={i === index ? 0 : -1}
                    onClick={() => onGetStarted?.(f, i)}>
                    {Icon.more}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="foc-strip">
          <button type="button" className="foc-btn foc-arrow" aria-label="Previous feature" onClick={() => step(-1)}>
            <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M11 0v16L0 8z" /></svg>
          </button>
          <div className="foc-win">
            <div className="foc-track" style={{ transform: "translateX(" + -start * ITEM + "px)" }}>
              {features.map((f, i) => (
                <div key={i} className="foc-th">
                  <button type="button" className="foc-btn" aria-current={i === index ? "true" : undefined} onClick={() => go(i)}>
                    <img src={f.image} alt="" width={56} height={56} draggable={false} />
                    <span>{f.label ?? f.title + " " + f.subtitle}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button type="button" className="foc-btn foc-arrow" aria-label="Next feature" onClick={() => step(1)}>
            <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M1 0v16l11-8z" /></svg>
          </button>
        </div>

      </div>
      <p className="foc-sr" aria-live="polite">{feature ? "Feature " + (index + 1) + " of " + n + ": " + feature.title + " " + feature.subtitle : ""}</p>
    </div>
    </div>
  )
}

export default FeatureOrbitCarousel
