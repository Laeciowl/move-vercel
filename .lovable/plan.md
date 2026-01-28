
## Correção do Erro de Senha "Fraca" no Cadastro

### O Problema
Usuários estão conseguindo criar senhas que passam em todos os requisitos visuais (barra verde, "Forte"), mas o cadastro falha com a mensagem em inglês: "Password is known to be weak and easy to guess, please choose a different one."

**Causa raiz:** O backend tem a funcionalidade de **Proteção contra Senhas Vazadas** ativada, que verifica se a senha está em bancos de dados públicos de vazamentos (como HaveIBeenPwned). Senhas como "Fl4m3ng0!" e "Wagner11!" são padrões comuns que foram encontrados em vazamentos anteriores.

### A Solução

1. **Traduzir e melhorar a mensagem de erro**
   - Detectar quando o erro é relacionado a senha vazada/conhecida
   - Exibir mensagem amigável em português explicando o motivo
   - Sugerir ao usuário criar uma senha mais única

2. **Atualizar o indicador visual de força da senha**
   - Adicionar um aviso informando que mesmo senhas "Fortes" podem ser rejeitadas se forem comuns
   - Ajudar o usuário a entender que a segurança vai além dos requisitos técnicos

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Adicionar tratamento para o erro de senha vazada com mensagem em português |
| `src/components/PasswordStrengthIndicator.tsx` | Adicionar aviso sobre senhas comuns |

---

### Detalhes Técnicos

**1. Tratamento do erro em `Auth.tsx` (linha ~169-176):**

Adicionar detecção do erro de senha vazada antes do fallback genérico:

```typescript
if (authError) {
  if (authError.message.includes("already registered")) {
    toast.error("Este e-mail já está cadastrado. Faça login.");
  } else if (authError.message.includes("weak") || authError.message.includes("easy to guess")) {
    toast.error("Esta senha foi encontrada em vazamentos de dados e não pode ser usada. Por favor, crie uma senha mais única.");
  } else if (authError.message.includes("fetch") || authError.message.includes("network")) {
    toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
  } else {
    toast.error(authError.message);
  }
  // ...
}
```

**2. Aviso no `PasswordStrengthIndicator.tsx`:**

Adicionar nota informativa abaixo dos requisitos quando a senha for "Forte":

```tsx
{metCount === 5 && (
  <p className="text-xs text-amber-600 mt-1">
    ⚠️ Evite senhas comuns como nomes de times, datas ou sequências conhecidas
  </p>
)}
```

### Resultado Esperado
- Usuários verão mensagem clara em português quando a senha for rejeitada por estar em listas de vazamentos
- O indicador visual alertará preventivamente sobre senhas comuns
- Melhor experiência de usuário sem confusão entre validação visual e validação do servidor
