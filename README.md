# Cardápio Digital — Sabor & Sorriso

Cardápio digital estático da hamburgueria **Sabor & Sorriso**, com busca, categorias, carrinho, checkout completo e envio do pedido pelo WhatsApp.

## Novidades desta versão

- **Cardápio atualizado** com novos preços, itens e remoção de produtos descontinuados.
- **Status Aberto/Fechado**: indicador visual no topo. A loja pode alternar o status acessando `?admin=1` na URL e usando o botão de ferramenta que aparece.
- **Checkout completo**: coleta tipo de entrega (Entrega/Retirada), endereço e forma de pagamento (Dinheiro, Cartão, Pix).
- **Taxa de cartão**: R$ 2,00 adicionados automaticamente ao escolher pagamento em cartão.

## Arquivos principais

- `index.html` — estrutura da página e acessibilidade.
- `style.css` — visual responsivo e temas.
- `script.js` — cardápio, carrinho, busca, checkout e WhatsApp.
- `img/` — logo e imagens padronizadas dos produtos.

## WhatsApp

O pedido é enviado para **+55 (21) 99579-2519**. O número fica configurado em `script.js` somente com DDD e dígitos: `21995792519`.

## Teste local

Abra `index.html` diretamente no navegador ou use um servidor local:

```bash
python3 -m http.server 8090
```

Depois acesse `http://localhost:8090`.
