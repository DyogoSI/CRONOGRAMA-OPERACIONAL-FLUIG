<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<div id="WidgetCronograma_${instanceId}" class="super-widget wcm-widget-class widget-cronograma" data-params="WidgetCronograma.instance()">
    <div class="crono-wrapper" style="font-family: 'Montserrat', sans-serif;">
        <div class="crono-container">
            
            <header class="crono-header" style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 20px;">
                <div class="header-banner" style="display: flex; align-items: center; gap: 12px;">
       
                    <img src="/cronograma_takono/resources/images/IRHO-BRANCO.png" alt="Logo" class="banner-logo" onerror="this.style.display='none'" style="margin: 0; max-height: 42px;">
                    <div class="header-text" style="text-align: left; margin: 0;">
                        <h1 style="margin: 0 0 2px 0; font-size: 25px; font-weight: 700; font-family: 'Montserrat', sans-serif; letter-spacing: -0.5px;">CRONOGRAMA OPERACIONAL</h1>
                        <p class="banner-subtitle" style="margin: 0; font-size: 12px; font-family: 'Montserrat', sans-serif; opacity: 0.8;">Painel de Acompanhamento e Implantação de Clientes</p>
                    </div>
                </div>

                <div class="header-filter" style="background: linear-gradient(135deg, #002b5c 0%, #0056b3 100%); padding: 8px 15px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.18); display: inline-flex; align-items: center; justify-content: center; gap: 15px; box-shadow: 0 4px 12px rgba(0, 43, 92, 0.15);">
                    <button id="btnPrevMes_${instanceId}" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 5px 10px; font-size: 16px; transition: transform 0.2s; outline: none;" title="Mês Anterior">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <label style="margin: 0; font-weight: 600; font-size: 18px; text-transform: lowercase; display: flex; align-items: center; gap: 10px; cursor: default; font-family: 'Montserrat', sans-serif;">
                        <i class="fa-regular fa-calendar-days" style="color: #ffffff; font-size: 20px;"></i> 
                        <span id="textoMesFiltro_${instanceId}" style="padding-bottom: 2px; text-align: center; color: #ffffff; font-weight: 700; min-width: 95px;">-</span>
                    </label>
                    <button id="btnNextMes_${instanceId}" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 5px 10px; font-size: 16px; transition: transform 0.2s; outline: none;" title="Próximo Mês">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                    <input type="hidden" id="mesFiltro_${instanceId}">
                </div>
            </header>

            <div class="top-summary-cards">
                <div class="summary-card danger">
                    <div class="card-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="card-info"><h3>Atividades Atrasadas</h3><span class="card-value">0</span></div>
                </div>
        
                <div class="summary-card warning">
                    <div class="card-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
                    <div class="card-info"><h3>Para Concluir</h3><span class="card-value">0</span></div>
                </div>
                <div class="summary-card success">
  
                    <div class="card-icon"><i class="fa-solid fa-check-double"></i></div>
                    <div class="card-info"><h3>Concluídas</h3><span class="card-value">0</span></div>
                </div>
                <div class="summary-card primary">
             
                    <div class="card-icon"><i class="fa-solid fa-list-check"></i></div>
                    <div class="card-info"><h3>Total de Atividades</h3><span class="card-value">0</span></div>
                </div>
            </div>

            <div class="main-content">
                <div class="left-column">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%;">ETAPA</th>
                                    <th style="width: 35%;">TAREFAS</th>
                                    <th style="width: 15%;">RESPONSÁVEL</th>
                                    <th style="width: 9%;">INÍCIO</th>
                                    <th style="width: 9%;">TÉRMINO</th>
                                    <th style="width: 8%;">DURAÇÃO</th>
                                    <th style="width: 9%;">COMPETÊNCIA</th>
                                    <th style="width: 10%;">STATUS</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-cronograma-${instanceId}"></tbody>
                        </table>
                    </div>

                    <section class="bpo-client-panel" aria-label="Indicadores BPO de Folha">
                        <div class="bpo-panel-header">
                            <div>
                                <span class="bpo-eyebrow">BPO de Folha</span>
                                <h2>Indicadores da Competência</h2>
                            </div>
                            <div class="bpo-period-badge">
                                <i class="fa-regular fa-calendar-check"></i>
                                <span id="bpo-periodo-${instanceId}">-</span>
                            </div>
                        </div>

                        <div class="bpo-kpi-grid kpi-folha-grid">
                            <div class="bpo-kpi-card">
                                <div class="bpo-kpi-icon sla"><i class="fa-solid fa-shield-halved"></i></div>
                                <div class="bpo-kpi-content">
                                    <span class="bpo-kpi-label">SLA de Processamento</span>
                                    <strong id="bpo-sla-processamento-${instanceId}">--</strong>
                                    <small id="bpo-sla-processamento-desc-${instanceId}">Aguardando marcos da folha</small>
                                </div>
                            </div>
                            <div class="bpo-kpi-card">
                                <div class="bpo-kpi-icon accuracy"><i class="fa-solid fa-circle-check"></i></div>
                                <div class="bpo-kpi-content">
                                    <span class="bpo-kpi-label">Taxa de Acerto</span>
                                    <strong id="bpo-taxa-acerto-${instanceId}">--</strong>
                                    <small id="bpo-taxa-acerto-desc-${instanceId}">Aguardando volume processado</small>
                                </div>
                            </div>
                            <div class="bpo-kpi-card">
                                <div class="bpo-kpi-icon error"><i class="fa-solid fa-triangle-exclamation"></i></div>
                                <div class="bpo-kpi-content">
                                    <span class="bpo-kpi-label">Erros de Lançamento</span>
                                    <strong id="bpo-erros-lancamento-${instanceId}">--</strong>
                                    <small id="bpo-erros-lancamento-desc-${instanceId}">Aguardando apontamentos</small>
                                </div>
                            </div>
                            <div class="bpo-kpi-card">
                                <div class="bpo-kpi-icon cost"><i class="fa-solid fa-coins"></i></div>
                                <div class="bpo-kpi-content">
                                    <span class="bpo-kpi-label">Custo por Colaborador</span>
                                    <strong id="bpo-custo-colaborador-${instanceId}">--</strong>
                                    <small id="bpo-custo-colaborador-desc-${instanceId}">Aguardando custo e headcount</small>
                                </div>
                            </div>
                            <div class="bpo-kpi-card">
                                <div class="bpo-kpi-icon turnover"><i class="fa-solid fa-people-arrows"></i></div>
                                <div class="bpo-kpi-content">
                                    <span class="bpo-kpi-label">Turnover da Competência</span>
                                    <strong id="bpo-turnover-${instanceId}">--</strong>
                                    <small id="bpo-turnover-desc-${instanceId}">Aguardando movimentações</small>
                                </div>
                            </div>
                        </div>

                        <div class="bpo-health-row">
                            <div class="bpo-health-main">
                                <div class="bpo-health-title">
                                    <span>Saúde Operacional</span>
                                    <strong id="bpo-saude-label-${instanceId}">0%</strong>
                                </div>
                                <div class="bpo-progress-track">
                                    <div id="bpo-saude-bar-${instanceId}" class="bpo-progress-bar" style="width: 0%;"></div>
                                </div>
                            </div>
                            <div class="bpo-insights" id="bpo-insights-${instanceId}">
                                <span><i class="fa-solid fa-circle-info"></i> Selecione uma competência com atividades para visualizar os sinais de operação.</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="right-column">
                    <div class="calendar-container">
                        <div class="calendar-header" style="justify-content: center; padding: 15px 0;">
                            <h3 id="month-year_${instanceId}" style="margin: 0; text-align: center; width: 100%; font-family: 'Montserrat', sans-serif;">-</h3>
                        </div>
                        <div class="calendar-body">
                            <div class="calendar-days-name"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div>
                            <div class="calendar-days" id="calendar-days_${instanceId}"></div>
                        </div>
                        <div class="calendar-legend">
                            <div class="legend-item"><span class="legend-color start"></span> Início de Etapa</div>
                            <div class="legend-item"><span class="legend-color end"></span> Término de Etapa</div>
                        </div>
                        
                        <div id="due-this-month-container-${instanceId}"></div>

                        <div class="overdue-months-panel">
                            <div class="overdue-months-title">
                                <div style="display: flex; align-items: center; gap: 7px;">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                    <span>Atividades Atrasadas</span>
                                </div>
                            </div>
                            <div id="overdue-months-${instanceId}" class="overdue-months-list">
                                <span class="overdue-months-empty">Nenhuma tarefa atrasada em outras competências.</span>
                            </div>
                        </div>

                        <div class="future-months-panel">
                            <div class="future-months-title">
                                <div style="display: flex; align-items: center; gap: 7px;">
                                    <i class="fa-solid fa-calendar-arrow-up"></i>
                                    <span>Atividades Futuras</span>
                                </div>
                            </div>
                            <div id="future-months-${instanceId}" class="future-months-list">
                                <span class="future-months-empty">Nenhuma atividade futura agendada.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-container chart-carousel" data-active-chart="duracao">
                        <div class="chart-carousel-header">
                            <button type="button" class="chart-nav" data-chart-nav="prev" title="Gráfico anterior" aria-label="Gráfico anterior">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <h3 class="chart-title" id="chart-title-${instanceId}" style="font-family: 'Montserrat', sans-serif;">DURAÇÃO DAS ETAPAS (EM DIAS)</h3>
                            <button type="button" class="chart-nav" data-chart-nav="next" title="Próximo gráfico" aria-label="Próximo gráfico">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>

                        <div class="chart-slide active" data-chart-slide="duracao">
                            <div class="css-chart" id="chart-cronograma-${instanceId}">
                                <div class="y-axis">
                                    <span>12</span><span>10</span><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span>
                                </div>
                            </div>
                            <div class="chart-footer">
                                <div class="summary-box">
                                    <i class="fa-regular fa-calendar-check"></i>
                                    <div>
                                        <h4>DURAÇÃO DO PROJETO:</h4>
                                        <p id="duracao-total-${instanceId}">0 dias</p>
                                    </div>
                                </div>
                                <div class="summary-box">
                                    <i class="fa-solid fa-bullseye"></i>
                                    <div>
                                        <h4>FOCO DA OPERAÇÃO:</h4>
                                        <p class="small-text">Escalabilidade e<br>Sucesso do Cliente</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="chart-slide" data-chart-slide="vencimento">
                            <div class="css-chart deadline-chart" id="chart-vencimento-${instanceId}">
                                <div class="y-axis" id="y-axis-vencimento-${instanceId}">
                                    <span>30</span><span>25</span><span>20</span><span>15</span><span>10</span><span>5</span><span>0</span>
                                </div>
                            </div>
                            <div class="chart-footer">
                                <div class="summary-box deadline-summary">
                                    <i class="fa-regular fa-hourglass-half"></i>
                                    <div>
                                        <h4>MENOR PRAZO:</h4>
                                        <p id="menor-prazo-${instanceId}">0 dias</p>
                                    </div>
                                </div>
                                <div class="summary-box deadline-summary">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                    <div>
                                        <h4>TAREFAS VENCIDAS:</h4>
                                        <p id="tarefas-vencidas-${instanceId}">0</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-footer"></div>
        </div>
    </div>
</div>
<script type="text/javascript" src="/cronograma_takono/resources/js/cronograma_takono.js"></script>