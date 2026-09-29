{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "blog-devshell";

  packages = with pkgs; [
    nodejs_24
    pnpm
    biome
  ];

  shellHook = ''
  '';
}