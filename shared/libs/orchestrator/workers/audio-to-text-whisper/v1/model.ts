// The model this version runs, pinned: one repository, one revision, the files
// transformers.js loads for it (q8: the quantized encoder and merged decoder),
// each with its size and sha256. We serve these files ourselves; nothing is
// fetched from Hugging Face at run time. The mirror script copies exactly
// these files and refuses any whose hash differs.
//
// A different model, revision or precision is a new worker version.

export const MODEL = {
  repo: "onnx-community/whisper-tiny",
  revision: "ff4177021cc41f7db950912b73ea4fdf7d01d8e7",
  dtype: "q8",
  files: [
    { path: "config.json", bytes: 2_243, sha256: "46aeea0a406afbeb563fc8e59ca10609203df4299af6a83f73752fef369efd2d" },
    { path: "generation_config.json", bytes: 3_772, sha256: "f5c67e5a4f7102f8cb4d058bc95da276bbc19eeec997267c3bb0f25ef68facd1" },
    { path: "preprocessor_config.json", bytes: 339, sha256: "a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d" },
    { path: "tokenizer.json", bytes: 2_480_466, sha256: "27fc476bfe7f17299480be2273fc0608e4d5a99aba2ab5dec5374b4482d1a566" },
    { path: "tokenizer_config.json", bytes: 282_683, sha256: "2a4c4281cf9f51ac6ccc406fdc711a087afe6530f671fa7b80953edc498275ce" },
    { path: "onnx/encoder_model_quantized.onnx", bytes: 10_124_990, sha256: "2af4a414ca47aa30f61246017e5fe82b0a8d229281d1255ba666a2a7f6b84d19" },
    { path: "onnx/decoder_model_merged_quantized.onnx", bytes: 30_719_241, sha256: "25e807a962b6349356d0ea5d0dfe530b7e5bf0e2a484aeca0359d03143faddd3" },
  ],
} as const;

/**
 * Where a file lives under the self-hosted base: the Hugging Face layout
 * (`<repo>/resolve/<revision>/<path>`), which is the path transformers.js asks
 * for once its remote host is our base.
 */
export function modelFilePath(path: string): string {
  return `${MODEL.repo}/resolve/${MODEL.revision}/${path}`;
}
