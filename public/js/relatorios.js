/**
 * relatorios.js
 * * Código JavaScript para a página de listagem de relatórios.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de Listagem de Relatórios carregada com sucesso.');

    // 1. Adiciona um listener de clique em todos os cards de relatório
    const reportCards = document.querySelectorAll('.card-relatorio');

    reportCards.forEach(card => {
        // Obter o ID do relatório armazenado no atributo data-id
        const relatorioId = card.getAttribute('data-id');

        // Adiciona um efeito visual sutil ao passar o mouse (opcional)
        card.style.cursor = 'pointer'; 
        
        // Adiciona um evento de clique em cada card
        card.addEventListener('click', (event) => {
            
            // Verifica se o clique não foi em um dos botões (para não duplicar a ação)
            if (!event.target.closest('.card-actions a')) {
                // Se o clique não foi nos botões, loga o ID e pode redirecionar
                console.log(`Card do Relatório ${relatorioId} clicado.`);
                
                // Exemplo: Redirecionar para a página de detalhes ao clicar no card,
                // caso o botão "Ver Detalhes" não seja clicado.
                // window.location.href = `/relatorios/${relatorioId}`;
            } else {
                 // Loga qual botão foi clicado
                 console.log(`Ação em botão no Relatório ${relatorioId}: ${event.target.textContent.trim()}`);
            }
        });
    });

    // 2. Exemplo: Adicionando um listener ao botão de Novo Relatório (para fins de log)
    const btnNovo = document.querySelector('.btn');
    if (btnNovo) {
        btnNovo.addEventListener('click', () => {
            console.log('Navegando para a página de criação de novo relatório...');
        });
    }

});