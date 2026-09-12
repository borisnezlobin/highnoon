import { FRAGMENT_SHADER, MAX_BALLS, VERTEX_SHADER } from './shader'
import { GLASS_TINT_COUNT, MAX_PIECES, type GlassPiece } from './glassStrand'
import type { Palette } from './palette'
import type { Blob } from './blob'

type UniformName =
  | 'uResolution' | 'uTime' | 'uPixelRatio' | 'uBalls' | 'uPieces'
  | 'uPieceCount' | 'uPulse' | 'uText' | 'uGround' | 'uInk' | 'uSignal' | 'uGlass'

const UNIFORM_NAMES: UniformName[] = [
  'uResolution', 'uTime', 'uPixelRatio', 'uBalls', 'uPieces',
  'uPieceCount', 'uPulse', 'uText', 'uGround', 'uInk', 'uSignal', 'uGlass',
]

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed to compile')
  }
  return shader
}

function linkProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Shader program failed to link')
  }
  return program
}

// The fragment shader has a small uniform budget, so each piece's tint index rides in the angle slot.
// Angles stay within ±TINT_SLOT / 2, which keeps the two separable with floor().
const TINT_SLOT = 16

function packAngleAndTint(angle: number, tint: number) {
  return angle + tint * TINT_SLOT
}

export class Renderer {
  private gl: WebGL2RenderingContext
  private uniforms: Record<UniformName, WebGLUniformLocation | null>
  private textTexture: WebGLTexture
  private ballData = new Float32Array(MAX_BALLS * 3)
  private pieceData = new Float32Array(MAX_PIECES * 4)

  constructor(canvas: HTMLCanvasElement, palette: Palette) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
    if (!gl) throw new Error('WebGL2 is unavailable')
    this.gl = gl
    const program = linkProgram(gl)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    this.uniforms = Object.fromEntries(
      UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Record<UniformName, WebGLUniformLocation | null>

    this.textTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.textTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.uniform1i(this.uniforms.uText, 0)

    gl.uniform3fv(this.uniforms.uGround, palette.ground)
    gl.uniform3fv(this.uniforms.uInk, palette.ink)
    gl.uniform3fv(this.uniforms.uSignal, palette.signal)
    gl.uniform3fv(this.uniforms.uGlass, new Float32Array(palette.glass.slice(0, GLASS_TINT_COUNT).flat()))
  }

  resize(width: number, height: number, pixelRatio: number) {
    const { gl } = this
    gl.viewport(0, 0, width, height)
    gl.uniform2f(this.uniforms.uResolution, width, height)
    gl.uniform1f(this.uniforms.uPixelRatio, pixelRatio)
  }

  uploadText(source: HTMLCanvasElement) {
    const { gl } = this
    gl.bindTexture(gl.TEXTURE_2D, this.textTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.generateMipmap(gl.TEXTURE_2D)
  }

  draw(frame: { time: number; pulse: number; blob: Blob; pieces: GlassPiece[]; cssHeight: number; pixelRatio: number }) {
    const { gl, uniforms } = this
    const { pixelRatio, cssHeight } = frame
    frame.blob.balls.forEach((ball, index) => {
      this.ballData.set([ball.position.x * pixelRatio, (cssHeight - ball.position.y) * pixelRatio, ball.radius * pixelRatio], index * 3)
    })
    frame.pieces.forEach((piece, index) => {
      this.pieceData.set([piece.x * pixelRatio, (cssHeight - piece.y) * pixelRatio, piece.size * pixelRatio, packAngleAndTint(-piece.angle, piece.tint)], index * 4)
    })
    gl.uniform3fv(uniforms.uBalls, this.ballData)
    gl.uniform4fv(uniforms.uPieces, this.pieceData)
    gl.uniform1i(uniforms.uPieceCount, frame.pieces.length)
    gl.uniform1f(uniforms.uTime, frame.time)
    gl.uniform1f(uniforms.uPulse, frame.pulse)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
