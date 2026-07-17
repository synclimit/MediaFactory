# FFmpeg Pipeline

Formula:
1. Interrupt
Hook -> Main -> CTA -> Resume Main

2. Overlay
Hook -> Main + CTA Overlay -> End

3. Seamless Loop
Hook(B) -> Main -> CTA -> Main -> Hook(A)

4. Shuffle
Engine memilih Formula secara acak per job.

Semua job dibuat di Pipeline, bukan render langsung.
