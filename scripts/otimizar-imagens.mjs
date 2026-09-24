// scripts/otimizar-imagens.mjs
// Baixa as fotos originais do site WordPress (energytreinamento.com.br) para
// public/img/originais/ e gera variantes WebP/AVIF responsivas em public/img/,
// além de public/img/manifest.json com as dimensões intrínsecas de cada foto.
//
// Uso: npm run img

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGINALS_DIR = path.join(ROOT, "public", "img", "originais");
const OUTPUT_DIR = path.join(ROOT, "public", "img");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

const BASE_URL = "https://energytreinamento.com.br";
const WIDTHS = [480, 960, 1200, 1600];
const MAX_ATTEMPTS = 2;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
  Referer: `${BASE_URL}/`,
};

// slug -> lista de candidatos (em ordem de preferência) de caminho relativo no site.
// Os recortes do Elementor (sufixo -eNNNNNNNN) ficam como fallback quando o
// arquivo original maior estiver bloqueado ou indisponível.
// Pilates e Fisioterapia ficam de fora: usam placeholder.
const IMAGES = {
  hero: [
    "/wp-content/uploads/2025/05/11-1-1-2.webp",
    "/wp-content/uploads/2025/05/11-1-1-2-e1747149133121.webp",
  ],
  cross: [
    "/wp-content/uploads/2025/05/123Imagem-do-WhatsApp-de-2025-04-28-as-16.33.53_a7e64dfb-1.webp",
    "/wp-content/uploads/2025/05/123Imagem-do-WhatsApp-de-2025-04-28-as-16.33.53_a7e64dfb-1-e1747149158230.webp",
  ],
  tenis: [
    "/wp-content/uploads/2024/08/Imagem-do-WhatsApp-de-2024-08-23-as-11.42.33_aa2d680e.jpg",
    "/wp-content/uploads/2024/08/Imagem-do-WhatsApp-de-2024-08-23-as-11.42.33_aa2d680e-e1724424213543.jpg",
  ],
  futebol: [
    "/wp-content/uploads/2024/08/Diseno-sin-titulo-3-min.jpg",
    "/wp-content/uploads/2024/08/Diseno-sin-titulo-3-min-1024x768.jpg",
  ],
  escalada: [
    "/wp-content/uploads/2024/08/Snapinsta.app_175537389_211460773746158_9097744042875935842_n_1080.jpg",
    "/wp-content/uploads/2024/08/Snapinsta.app_175537389_211460773746158_9097744042875935842_n_1080-e1724342278430.jpg",
  ],
  squash: [
    "/wp-content/uploads/2024/08/squash.jpeg",
    "/wp-content/uploads/2024/08/squash-e1724342367185-1024x781.jpeg",
  ],
  corrida: [
    "/wp-content/uploads/2025/05/123Imagem-do-WhatsApp-de-2025-04-17-as-15.53.02_e50fbac2.webp",
    "/wp-content/uploads/2025/05/123Imagem-do-WhatsApp-de-2025-04-17-as-15.53.02_e50fbac2-e1747155146742.webp",
  ],
  eventos: [
    "/wp-content/uploads/2025/05/eventocorporativo1-1.webp",
    "/wp-content/uploads/2025/05/eventocorporativo1-1-e1747155655696-1024x788.webp",
  ],
  "energy-road": [
    "/wp-content/uploads/2025/05/Imagem-do-WhatsApp-de-2025-05-12-as-14.44.08_505b711f-scaled.webp",
  ],
  restaurante: [
    "/wp-content/uploads/2024/08/WhatsApp-Image-2019-08-20-at-21.46.06-1-1-e1566683402410-ogmtp7dbgby9b9ekuoz2fmv3juay6gz6fozv2mc02s-e1724356032302.webp",
  ],
  churrasqueira: [
    "/wp-content/uploads/2024/08/WhatsApp-Image-2019-08-20-at-21.46.01-3-e1566683300219-ogmtnpsimrwwxhkejjtbzidtovn0zq2h8bt6pujfxg-e1724355981780.webp",
  ],
  estacionamento: [
    "/wp-content/uploads/2024/08/28.jpeg",
    "/wp-content/uploads/2024/08/28-e1724355099241.jpeg",
  ],
  pilates: [
    "/wp-content/uploads/2024/08/depositphotos_81541380-stock-photo-pilates-woman-in-reformer-teaser.webp",
    "/wp-content/uploads/2024/08/depositphotos_81541380-stock-photo-pilates-woman-in-reformer-teaser-e1724342469144.webp",
  ],
  fisioterapia: [
    "/wp-content/uploads/2025/05/o-que-e-fisioterapia.webp",
    "/wp-content/uploads/2025/05/o-que-e-fisioterapia-e1747155403100.webp",
  ],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Baixa e valida a imagem original de um slug, tentando os candidatos em
 * ordem de preferência (o 1º costuma ser o arquivo original maior do
 * WordPress; os seguintes são recortes/fallbacks). O primeiro candidato que
 * baixar e validar com sharp é o mantido; os demais nem são tentados.
 * Idempotente: se o arquivo de um candidato já existir, pula o download.
 * Retorna { ok, destPath, reused, candidateIndex, urlPath, reason }.
 */
async function ensureOriginal(slug, candidates) {
  let lastError = "nenhum candidato configurado";

  for (let i = 0; i < candidates.length; i++) {
    const urlPath = candidates[i];
    const url = BASE_URL + urlPath;
    const ext = path.extname(new URL(url).pathname) || ".jpg";
    const destPath = path.join(ORIGINALS_DIR, `${slug}${ext}`);

    if (fs.existsSync(destPath)) {
      // já baixado: apenas valida que continua íntegro
      try {
        await sharp(destPath).metadata();
        return { ok: true, destPath, reused: true, candidateIndex: i, urlPath };
      } catch {
        fs.rmSync(destPath, { force: true });
        // cai para o fluxo de download abaixo
      }
    }

    let candidateError = "erro desconhecido";
    let succeeded = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url, { headers: FETCH_HEADERS });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0) {
          throw new Error("resposta vazia");
        }
        if (buf[0] === 0x3c /* '<' */) {
          throw new Error("resposta HTML (bloqueio do servidor?), não é imagem");
        }
        // valida que é uma imagem decodificável de fato
        await sharp(buf).metadata();

        fs.writeFileSync(destPath, buf);
        succeeded = true;
        break;
      } catch (err) {
        candidateError = err.message || String(err);
        if (attempt < MAX_ATTEMPTS) {
          await sleep(400);
        }
      }
    }

    if (succeeded) {
      return { ok: true, destPath, reused: false, candidateIndex: i, urlPath };
    }
    lastError = `candidato ${i + 1} (${urlPath}) falhou: ${candidateError}`;
  }

  return { ok: false, reason: lastError };
}

/**
 * Gera variantes WebP/AVIF para as larguras alvo, sem upscale.
 * Retorna a lista de larguras efetivamente geradas.
 */
async function generateVariants(slug, originalPath, originalMeta) {
  const generatedWidths = [];
  const originalMtime = fs.statSync(originalPath).mtimeMs;

  for (const width of WIDTHS) {
    if (width > originalMeta.width) {
      continue; // nunca faz upscale
    }

    const webpPath = path.join(OUTPUT_DIR, `${slug}-${width}.webp`);
    const avifPath = path.join(OUTPUT_DIR, `${slug}-${width}.avif`);

    const webpFresh =
      fs.existsSync(webpPath) &&
      fs.statSync(webpPath).mtimeMs > originalMtime;
    const avifFresh =
      fs.existsSync(avifPath) &&
      fs.statSync(avifPath).mtimeMs > originalMtime;

    if (!webpFresh) {
      await sharp(originalPath)
        .resize({ width, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 78 })
        .toFile(webpPath);
    }
    if (!avifFresh) {
      await sharp(originalPath)
        .resize({ width, withoutEnlargement: true, fit: "inside" })
        .avif({ quality: 50, effort: 4 })
        .toFile(avifPath);
    }

    generatedWidths.push(width);
  }

  return generatedWidths;
}

async function main() {
  fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest = {};
  let downloadedCount = 0;
  let reusedCount = 0;
  let failedCount = 0;
  let filesGenerated = 0;
  const failures = [];

  for (const [slug, candidates] of Object.entries(IMAGES)) {
    const dl = await ensureOriginal(slug, candidates);

    if (!dl.ok) {
      failedCount++;
      failures.push(slug);
      console.log(`${slug}: FALHOU no download (${dl.reason})`);
      continue;
    }

    if (dl.reused) reusedCount++;
    else downloadedCount++;

    let meta;
    try {
      meta = await sharp(dl.destPath).metadata();
    } catch (err) {
      failedCount++;
      failures.push(slug);
      console.log(`${slug}: FALHOU ao ler metadados (${err.message})`);
      continue;
    }

    const widths = await generateVariants(slug, dl.destPath, meta);
    filesGenerated += widths.length * 2; // webp + avif por largura

    manifest[slug] = {
      w: meta.width,
      h: meta.height,
      widths,
      src: dl.urlPath,
    };

    const candidateLabel = `${dl.candidateIndex + 1}º`;
    console.log(
      `${slug}: ${meta.width}x${meta.height} -> larguras [${widths.join(
        ", "
      )}] (candidato ${candidateLabel}${dl.reused ? ", reaproveitado" : ""})${
        widths.length === 0
          ? " (original menor que todas as metas, nenhuma variante gerada)"
          : ""
      }`
    );
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log("");
  console.log(
    `Resumo: ${downloadedCount} baixados, ${reusedCount} reaproveitados, ${failedCount} falharam, ${filesGenerated} arquivos de variantes gerados/atualizados.`
  );
  if (failures.length > 0) {
    console.log(`Slugs com falha: ${failures.join(", ")}`);
  }
  console.log(`Manifesto escrito em ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exitCode = 1;
});
