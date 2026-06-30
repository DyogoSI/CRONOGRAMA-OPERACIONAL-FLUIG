var WidgetCronograma = SuperWidget.extend({
    eventDates: {},
    currentDate: null,
    mockToday: null,
    activeOverdueMonthFilter: null,
    
    NOME_DATASET: "DScronogramaTakono", 
    dadosCronograma: [],

    bindings: {
        local: {},
        global: {}
    },

    init: function() {
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        
        var hojeObj = new Date();
        hojeObj.setHours(0, 0, 0, 0);
        this.mockToday = hojeObj.getTime();
        
        this.currentDate = new Date(hojeObj.getFullYear(), hojeObj.getMonth(), 1);
        var mesAtual = hojeObj.getFullYear() + '-' + ("0" + (hojeObj.getMonth() + 1)).slice(-2);
        
        $widgetContext.find("#mesFiltro_" + this.instanceId).val(mesAtual);
        that.atualizarTextoMes(mesAtual);

        this.carregarDadosDoBanco();

        $widgetContext.on('mouseenter', '#btnPrevMes_' + this.instanceId + ', #btnNextMes_' + this.instanceId, function() {
            $(this).css('transform', 'scale(1.2)');
            $(this).css('color', 'var(--brand-orange, #ff6b00)');
        }).on('mouseleave', '#btnPrevMes_' + this.instanceId + ', #btnNextMes_' + this.instanceId, function() {
            $(this).css('transform', 'scale(1)');
            $(this).css('color', '#ffffff');
        });

        $widgetContext.on('click', '#btnPrevMes_' + this.instanceId, function() {
            that.activeOverdueMonthFilter = null;
            that.currentDate.setMonth(that.currentDate.getMonth() - 1);
            var novoMes = that.currentDate.getFullYear() + '-' + ("0" + (that.currentDate.getMonth() + 1)).slice(-2);
            $widgetContext.find("#mesFiltro_" + that.instanceId).val(novoMes);
            that.atualizarTextoMes(novoMes);
            that.renderizarDados();
        });

        $widgetContext.on('click', '#btnNextMes_' + this.instanceId, function() {
            that.activeOverdueMonthFilter = null;
            that.currentDate.setMonth(that.currentDate.getMonth() + 1);
            var novoMes = that.currentDate.getFullYear() + '-' + ("0" + (that.currentDate.getMonth() + 1)).slice(-2);
            $widgetContext.find("#mesFiltro_" + that.instanceId).val(novoMes);
            that.atualizarTextoMes(novoMes);
            that.renderizarDados();
        });

        $widgetContext.on('click', '[data-chart-nav]', function(e) {
            e.stopPropagation();
            that.alternarGrafico();
        });

        $widgetContext.on('click', '[data-highlight-step]', function(e) {
            e.stopPropagation();
            that.resetFilters(false);
            var step = $(this).attr('data-step');
            var targetId = '#step-' + step + '-' + that.instanceId;
            var $targetRow = $widgetContext.find(targetId);
            
            if ($targetRow.length > 0) {
                $targetRow[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                void $targetRow[0].offsetWidth; 
                $targetRow.addClass('row-highlighted');
            }
            
            $(this).addClass('bar-highlighted');
            var originalId = $(this).attr('data-original-id') || step;
            that.changeContextToActivity(originalId);
        });

        $widgetContext.on('click', 'tbody tr', function(e) {
            e.stopPropagation();
            var rowId = $(this).attr('id');
            if (!rowId) return;
            var stepId = rowId.split('-')[1];
            
            that.resetFilters(false);
            $(this).addClass('row-highlighted');
            
            var $targetBar = $widgetContext.find('.bar-group[data-step="' + stepId + '"]');
            if ($targetBar.length > 0) {
                $targetBar.addClass('bar-highlighted');
            }
            
            that.changeContextToActivity(stepId);
        });

        $widgetContext.on('click', '.overdue-task-item, .vencimento-item, .future-task-item', function(e) {
            e.stopPropagation();
            that.activeOverdueMonthFilter = null;
            
            var taskId = $(this).attr('data-task-id');
            var taskStartMonth = $(this).attr('data-task-month');

            that.currentDate = new Date(parseInt(taskStartMonth.split('-')[0], 10), parseInt(taskStartMonth.split('-')[1], 10) - 1, 1);
            $widgetContext.find("#mesFiltro_" + that.instanceId).val(taskStartMonth);
            that.atualizarTextoMes(taskStartMonth);
            
            that.renderizarDados();

            setTimeout(function() {
                var targetId = '#step-' + taskId + '-' + that.instanceId;
                var $targetRow = $widgetContext.find(targetId);
                if ($targetRow.length > 0) {
                    $targetRow[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    $targetRow.addClass('row-highlighted');
                }
                that.changeContextToActivity(taskId);
            }, 150);
        });

        $widgetContext.on('click', '.toggle-month-btn', function(e) {
            e.stopPropagation();
            var $listWrapper = $(this).siblings('.month-task-list-wrapper');
            var $icon = $(this).find('.month-toggle-icon');
            
            $icon.toggleClass('open');
            if ($icon.hasClass('open')) {
                $icon.css('transform', 'rotate(180deg)');
            } else {
                $icon.css('transform', 'rotate(0deg)');
            }
            $listWrapper.slideToggle(250);
        });

        $widgetContext.on('click', '.toggle-month-btn-due', function(e) {
            e.stopPropagation();
            var $listWrapper = $(this).siblings('.month-task-list-wrapper');
            var $icon = $(this).find('.month-toggle-icon');
            $icon.toggleClass('open');
            if ($icon.hasClass('open')) $icon.css('transform', 'rotate(180deg)');
            else $icon.css('transform', 'rotate(0deg)');
            $listWrapper.slideToggle(250);
        });

        $widgetContext.on('click', '.summary-card', function() {
            var $card = $(this);
            var isAlreadyActive = $card.hasClass('active-card');
            that.activeOverdueMonthFilter = null;
            that.resetFilters(true);
            
            if (!isAlreadyActive) {
                $card.addClass('active-card');
                var isDanger = $card.hasClass('danger');
                var isWarning = $card.hasClass('warning');
                var isSuccess = $card.hasClass('success');
                var isPrimary = $card.hasClass('primary');
                
                $widgetContext.find('tbody tr').each(function() {
                    var $row = $(this);
                    var statusText = $row.find('.status').text().trim().toLowerCase();
                    var isConcluido = statusText === 'concluído';
                    var isAtrasado = statusText === 'pendente' && isDanger; 
                    
                    if (!isConcluido && isDanger) {
                        var endColText = $row.find('.date-end').text().trim();
                        if (endColText && that.validarDataBanco(endColText)) {
                            var e = endColText.split('/');
                            var endTime = new Date(e[2], e[1]-1, e[0]).getTime();
                            if (endTime < that.mockToday) isAtrasado = true;
                        }
                    }
                    
                    var showRow = false;
                    if (isPrimary) showRow = true;
                    else if (isSuccess) showRow = isConcluido;
                    else if (isWarning) showRow = !isConcluido;
                    else if (isDanger) showRow = isAtrasado;
                    
                    if (showRow) {
                        $row.show();
                        $row.css('animation', 'none');
                        void $row[0].offsetWidth; 
                        $row.addClass('row-highlighted');
                    } else {
                        $row.hide();
                    }
                });
            }
        });
    },

    atualizarTextoMes: function(val) {
        if(!val) return;
        var partes = val.split('-');
        var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        var mesNome = meses[parseInt(partes[1], 10) - 1];
        $("#textoMesFiltro_" + this.instanceId).text(mesNome + "/" + partes[0]);
    },

    validarDataBanco: function(dataStr) {
        if (!dataStr || dataStr === "A definir" || dataStr === "") return false;
        var partes = dataStr.split('/');
        if (partes.length !== 3) return false;
        var dia = parseInt(partes[0], 10);
        var mes = parseInt(partes[1], 10);
        var ano = parseInt(partes[2], 10);
        if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
        if (mes < 1 || mes > 12) return false;
        if (ano < 2000 || ano > 2100) return false;
        return true;
    },

    parseDate: function(dataBr) {
        if (!dataBr || dataBr === "A definir" || dataBr === "Data Inválida" || !this.validarDataBanco(dataBr)) return null;
        var p = dataBr.split('/');
        return new Date(p[2], p[1]-1, p[0]).getTime();
    },

    parseNumber: function(valor) {
        if (valor === undefined || valor === null || valor === "") return null;
        if (typeof valor === "number") return isNaN(valor) ? null : valor;
        var normalizado = String(valor).replace(/[^\d,.-]/g, "");
        if (normalizado.indexOf(",") > -1) {
            normalizado = normalizado.replace(/\./g, "").replace(",", ".");
        }
        var numero = parseFloat(normalizado);
        return isNaN(numero) ? null : numero;
    },

    getFirstNumber: function(item, campos) {
        for (var i = 0; i < campos.length; i++) {
            var numero = this.parseNumber(item[campos[i]]);
            if (numero !== null) return numero;
        }
        return null;
    },

    formatCurrencyBR: function(valor) {
        if (valor === null || valor === undefined || isNaN(valor)) return "--";
        return "R$ " + valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },

    alternarGrafico: function() {
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        var $carousel = $widgetContext.find(".chart-carousel");
        var atual = $carousel.attr("data-active-chart") || "duracao";
        var proximo = atual === "duracao" ? "vencimento" : "duracao";
        var titulo = proximo === "duracao" ? "DURAÇÃO DAS ETAPAS (EM DIAS)" : "DIAS RESTANTES PARA VENCER";
        
        $carousel.attr("data-active-chart", proximo);
        $widgetContext.find("[data-chart-slide]").removeClass("active");
        $widgetContext.find('[data-chart-slide="' + proximo + '"]').addClass("active");
        $widgetContext.find("#chart-title-" + this.instanceId).text(titulo);
    },

    avaliarStatusAtual: function(dataTerminoStr, statusSalvo) {
        if ((statusSalvo || "").toLowerCase() === 'concluído') {
            return { texto: "Concluído", hex: "#2ecc71" }; 
        }
        
        if (!this.validarDataBanco(dataTerminoStr)) {
            return { texto: "Pendente", hex: "#3498db" }; 
        }

        var p = dataTerminoStr.split('/');
        var dTermino = new Date(p[2], p[1]-1, p[0]);
        dTermino.setHours(0,0,0,0);
        
        var hoje = new Date(this.mockToday);
        hoje.setHours(0,0,0,0);
        
        var diffTime = dTermino.getTime() - hoje.getTime();
        var diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDias < 0) return { texto: "Pendente", hex: "#e74c3c" }; 
        else if (diffDias === 0) return { texto: "Vence hoje", hex: "#e67e22" }; 
        else if (diffDias > 0 && diffDias <= 3) return { texto: "Próxima de vencer", hex: "#f1c40f" }; 
        else return { texto: "Pendente", hex: "#3498db" }; 
    },

    carregarDadosDoBanco: function() {
        var that = this;
        $.ajax({
            url: '/api/public/ecm/dataset/datasets',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name: that.NOME_DATASET }),
            success: function(response) {
                that.dadosCronograma = [];
                var valores = response.content.values;
                var idCounter = 1;

                if (valores && valores.length > 0) {
                    for (var i = 0; i < valores.length; i++) {
                        var item = valores[i];
                        if (!item.documentid || !item.txt_atividade) continue;
                        
                        var dtInicio = item.data_inicio || "";
                        var dtTermino = item.data_termino || "";

                        if (dtInicio === "") dtInicio = "A definir";
                        else if (!that.validarDataBanco(dtInicio)) dtInicio = "Data Inválida";
                        if (dtTermino === "") dtTermino = "A definir";
                        else if (!that.validarDataBanco(dtTermino)) dtTermino = "Data Inválida";
                        
                        var competenciaStr = item.txt_competencia || "";
                        if (!competenciaStr) {
                            var dtCompat = that.parseDate(dtInicio) || that.parseDate(dtTermino);
                            if (dtCompat) {
                                var dCompat = new Date(dtCompat);
                                competenciaStr = dCompat.getFullYear() + "-" + ("0" + (dCompat.getMonth() + 1)).slice(-2);
                            }
                        }

                        var statusDinamico = that.avaliarStatusAtual(dtTermino, item.txt_status);
                        var duracaoInt = parseInt(item.num_duracao) || 0;
                        var responsavelFormatado = (item.txt_responsavel && item.txt_responsavel.trim() !== "") ? item.txt_responsavel : "Não atribuído";
                        
                        var situacaoTemporal = "Indefinida";
                        var tInicio = that.parseDate(dtInicio);
                        var tTermino = that.parseDate(dtTermino);
                        
                        if (tTermino && tTermino < that.mockToday) {
                            situacaoTemporal = (statusDinamico.texto !== 'Concluído') ? "Passada (Atrasada)" : "Passada (Concluída)";
                        } else if (tInicio && tInicio > that.mockToday) {
                            situacaoTemporal = "Futura (Pendente)";
                        } else if (tInicio && tTermino && that.mockToday >= tInicio && that.mockToday <= tTermino) {
                            situacaoTemporal = (statusDinamico.texto !== 'Concluído') ? "Atual (Em andamento)" : "Atual (Concluída)";
                        } else if (!tInicio && tTermino && tTermino >= that.mockToday) {
                            situacaoTemporal = (statusDinamico.texto === 'Concluído') ? "Passada (Concluída)" : "Futura (Pendente)";
                        }

                        that.dadosCronograma.push({
                            id: idCounter++, 
                            documentId: item.documentid,
                            icon: "fa-solid fa-thumbtack", 
                            name: item.txt_atividade.toUpperCase(),
                            desc: item.txt_descricao || "-",
                            responsavel: responsavelFormatado, 
                            competencia: competenciaStr, 
                            start: dtInicio,
                            end: dtTermino,
                            duration: duracaoInt,
                            status: statusDinamico.texto,
                            statusHex: statusDinamico.hex,
                            situacaoTemporal: situacaoTemporal,
                            folhasProcessadas: that.getFirstNumber(item, ["num_folhas_processadas", "num_folhas", "qtd_folhas_processadas"]),
                            folhasComRetrabalho: that.getFirstNumber(item, ["num_folhas_retrabalho", "num_retrabalhos", "qtd_retrabalhos"]),
                            errosLancamento: that.getFirstNumber(item, ["num_erros_lancamento", "qtd_erros_lancamento", "num_apontamentos_incorretos"]),
                            custoFolha: that.getFirstNumber(item, ["vl_custo_folha", "num_custo_folha", "valor_custo_folha"]),
                            colaboradores: that.getFirstNumber(item, ["num_colaboradores", "qtd_colaboradores", "total_colaboradores"]),
                            desligamentos: that.getFirstNumber(item, ["num_desligamentos", "qtd_desligamentos", "num_rescisoes"]),
                            admissoes: that.getFirstNumber(item, ["num_admissoes", "qtd_admissoes"]),
                            custoRescisoes: that.getFirstNumber(item, ["vl_rescisoes", "vl_custo_rescisoes", "valor_rescisoes"]),
                            custoAdmissoes: that.getFirstNumber(item, ["vl_admissoes", "vl_custo_admissoes", "valor_admissoes"])
                        });
                    }
                }
                that.renderizarDados();
            },
            error: function(err) {
                console.error("Erro ao carregar o Dataset: ", err);
                that.renderizarDados();
            }
        });
    },

    renderizarDados: function(keepSidePanels) {
        var that = this;
        var $tbody = $("#tbody-cronograma-" + this.instanceId);
        var $chart = $("#chart-cronograma-" + this.instanceId);
        var $deadlineChart = $("#chart-vencimento-" + this.instanceId);
        
        $tbody.empty();
        $chart.find('.bar-group').remove(); 
        $deadlineChart.find('.bar-group').remove();

        var duracaoGeral = 0;
        var mesSelecionado = $("#mesFiltro_" + this.instanceId).val();
        
        // Mantém o filtro pela DATA FÍSICA de início ou término da atividade
        var dadosFiltrados = this.dadosCronograma.filter(function(item) {
            if (item.end === "Data Inválida" || item.end === "A definir") return false;
            
            var tInicio = that.parseDate(item.start) || that.parseDate(item.end);
            var dInicio = new Date(tInicio);
            var itemMes = ("0" + (dInicio.getMonth() + 1)).slice(-2);
            var itemAno = dInicio.getFullYear();
            
            return (itemAno + '-' + itemMes === mesSelecionado);
        });

        if (this.activeOverdueMonthFilter === mesSelecionado) {
            dadosFiltrados = dadosFiltrados.filter(function(item) {
                var termino = that.parseDate(item.end);
                var concluido = (item.status || "").toLowerCase() === "concluído";
                return termino !== null && termino < that.mockToday && !concluido;
            });
        }

        if (dadosFiltrados.length === 0) {
            var mensagemVazia = "Nenhuma atividade agendada fisicamente para este mês.";
            
            $tbody.append('<tr><td colspan="8" class="text-center" style="padding: 30px; color: #888;">' + mensagemVazia + '</td></tr>');
            $("#duracao-total-" + this.instanceId).text("0 dias");
            $("#menor-prazo-" + this.instanceId).text("0 dias");
            $("#tarefas-vencidas-" + this.instanceId).text("0");
            
            this.renderContextoGeral(dadosFiltrados);
            this.updateBpoIndicators(dadosFiltrados);
            this.eventDates = {};
            this.updateSummaryCards();
            
            if (!keepSidePanels) {
                this.renderOverdueMonthIndicators();
                this.renderFutureMonthIndicators(); 
            }
            
            this.extractDates(); 
            this.renderCalendar(this.currentDate);
            return;
        }

        dadosFiltrados.sort(function(a, b) {
            var valA = (a.start === "A definir" || a.start === "Data Inválida") ? a.end : a.start;
            var valB = (b.start === "A definir" || b.start === "Data Inválida") ? b.end : b.start;
            var dateA = valA.split('/').reverse().join(''); 
            var dateB = valB.split('/').reverse().join('');
            return dateA.localeCompare(dateB);
        });

        var prazoInfoPorId = {};
        var maxDiasRestantes = 0;
        var menorPrazo = null;
        var tarefasVencidas = 0;

        dadosFiltrados.forEach(function(item) {
            var diasRaw = that.calcularDiasParaVencer(item);
            var diasRestantes = diasRaw === null ? 0 : Math.max(0, diasRaw);
            var concluido = (item.status || "").toLowerCase() === "concluído";

            prazoInfoPorId[item.id] = {
                diasRaw: diasRaw,
                diasRestantes: diasRestantes,
                concluido: concluido
            };

            if (diasRaw !== null) {
                maxDiasRestantes = Math.max(maxDiasRestantes, diasRestantes);
                if (!concluido && diasRaw < 0) {
                    tarefasVencidas++;
                } else if (!concluido) {
                    menorPrazo = menorPrazo === null ? diasRestantes : Math.min(menorPrazo, diasRestantes);
                }
            }
        });

        maxDiasRestantes = Math.max(maxDiasRestantes, 1);
        var limiteGraficoVencimento = this.atualizarEixoGraficoVencimento(maxDiasRestantes);

        dadosFiltrados.forEach(function(item, index) {
            var displayId = index + 1; 
            item.class = "c" + ((index % 8) + 1);

            var descricaoHtml = item.desc && item.desc !== "-"
                ? '<div style="font-size: 11px; color: #64748b; margin-top: 4px; padding-left: 5px; font-weight: 500;">' + item.desc + '</div>'
                : '';

            // Porém na hora de EXIBIR na tabela, puxa o texto real gravado no gestor.
            var labelCompetencia = "-";
            if (item.competencia) {
                labelCompetencia = that.formatarCompetencia(item.competencia);
            }

            var trHtml = '<tr id="step-' + item.id + '-' + that.instanceId + '" style="cursor: pointer;" title="Clique para focar nos detalhes desta atividade">' +
                '<td data-label="ETAPA"><span class="step-number">' + displayId + '</span></td>' +
                '<td data-label="TAREFAS">' +
                    '<div class="process-col ' + item.class + '"><i class="' + item.icon + '"></i> ' + item.name + '</div>' +
                    descricaoHtml +
                '</td>' +
                '<td data-label="RESPONSÁVEL">' + item.responsavel + '</td>' +
                '<td data-label="INÍCIO" class="date-col date-start">' + item.start + '</td>' +
                '<td data-label="TÉRMINO" class="date-col date-end">' + item.end + '</td>' +
                '<td data-label="DURAÇÃO">' + item.duration + ' dias</td>' +
                '<td data-label="COMPETÊNCIA" style="font-weight: 700; color: var(--primary-blue); font-size: 11px; text-transform: lowercase;">' + labelCompetencia + '</td>' +
                '<td data-label="STATUS">' +
                    '<div class="status"><span class="dot" style="background-color: ' + item.statusHex + ';"></span> ' + item.status + '</div>' +
                    '<div style="font-size: 9px; color: var(--text-muted); margin-top: 5px; font-weight: 800;">' + item.situacaoTemporal + '</div>' +
                '</td>' +
            '</tr>';
            $tbody.append(trHtml);

            var alturaPercent = Math.min(Math.round((item.duration / 12) * 100), 100);
            var barClass = "bg" + ((index % 8) + 1);
            var tooltipName = item.name.replace(/<br>/g, ' '); 

            var barHtml = '<div class="bar-group" data-highlight-step data-step="' + item.id + '" data-original-id="'+ item.id +'">' +
                '<div class="bar ' + barClass + '" style="height: ' + alturaPercent + '%;" data-tooltip="' + tooltipName + '">' +
                    '<span class="bar-val">' + item.duration + '</span>' +
                '</div>' +
                '<span class="bar-label">' + displayId + '</span>' +
            '</div>';
            $chart.append(barHtml);

            var prazoInfo = prazoInfoPorId[item.id] || { diasRaw: null, diasRestantes: 0, concluido: false };
            var alturaVencimento = Math.round((prazoInfo.diasRestantes / limiteGraficoVencimento) * 100);
            var classePrazo = that.getDeadlineClass(prazoInfo);
            var textoPrazo = prazoInfo.diasRaw === null
                ? "Sem término definido"
                : (prazoInfo.diasRaw < 0 ? "Vencida há " + Math.abs(prazoInfo.diasRaw) + " dia(s)" : prazoInfo.diasRestantes + " dia(s)");

            var deadlineHtml = '<div class="bar-group" data-highlight-step data-step="' + item.id + '" data-original-id="'+ item.id +'">' +
                '<div class="bar ' + classePrazo + '" style="height: ' + alturaVencimento + '%;" data-tooltip="' + tooltipName + ' - ' + textoPrazo + '">' +
                    '<span class="bar-val">' + prazoInfo.diasRestantes + '</span>' +
                '</div>' +
                '<span class="bar-label">' + displayId + '</span>' +
            '</div>';
            $deadlineChart.append(deadlineHtml);

            duracaoGeral += item.duration;
        });

        $("#duracao-total-" + this.instanceId).text(duracaoGeral + " dias");
        $("#menor-prazo-" + this.instanceId).text((menorPrazo === null ? 0 : menorPrazo) + " dias");
        $("#tarefas-vencidas-" + this.instanceId).text(tarefasVencidas);
        
        this.updateSummaryCards();
        this.updateBpoIndicators(dadosFiltrados);
        
        if (!keepSidePanels) {
            this.renderOverdueMonthIndicators();
            this.renderFutureMonthIndicators(); 
        }
        
        this.extractDates(); 
        this.renderCalendar(this.currentDate);
        this.renderContextoGeral(dadosFiltrados);
    },

    calcularDiasParaVencer: function(item) {
        var termino = this.parseDate(item.end);
        if (termino === null) return null;
        return Math.ceil((termino - this.mockToday) / (1000 * 60 * 60 * 24));
    },

    atualizarEixoGraficoVencimento: function(maxDiasRestantes) {
        var max = Math.max(maxDiasRestantes || 1, 1);
        var step = Math.max(1, Math.ceil(max / 6));
        var topo = step * 6;
        var labels = [];
        for (var i = 6; i >= 0; i--) {
            labels.push('<span>' + (step * i) + '</span>');
        }
        $("#y-axis-vencimento-" + this.instanceId).html(labels.join(""));
        return topo;
    },

    getDeadlineClass: function(prazoInfo) {
        if (!prazoInfo || prazoInfo.diasRaw === null) return "deadline-critical";
        if (prazoInfo.diasRaw < 0) return "deadline-overdue";
        if (prazoInfo.diasRestantes <= 2) return "deadline-critical";
        if (prazoInfo.diasRestantes <= 5) return "deadline-warning";
        return "deadline-safe";
    },

    renderOverdueMonthIndicators: function() {
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        var $container = $widgetContext.find("#overdue-months-" + this.instanceId);
        var meses = {};
        
        if ($container.length === 0) return;

        this.dadosCronograma.forEach(function(item) {
            if (item.end === "Data Inválida" || item.end === "A definir") return;

            var termino = that.parseDate(item.end);
            var status = (item.status || "").toLowerCase();
            var concluido = status === "concluído";

            if (!termino || concluido || termino >= that.mockToday) return;

            var dataTermino = new Date(termino);
            var chaveMesTermino = dataTermino.getFullYear() + "-" + ("0" + (dataTermino.getMonth() + 1)).slice(-2);

            var tInicio = that.parseDate(item.start) || termino;
            var dInicio = new Date(tInicio);
            var chaveMesInicio = dInicio.getFullYear() + "-" + ("0" + (dInicio.getMonth() + 1)).slice(-2);

            if (!meses[chaveMesTermino]) {
                meses[chaveMesTermino] = { total: 0, competencia: chaveMesTermino, tarefas: [] };
            }
            meses[chaveMesTermino].total++;
            meses[chaveMesTermino].tarefas.push({ id: item.id, name: item.name, startMes: chaveMesInicio });
        });

        var chaves = Object.keys(meses).sort();
        if (chaves.length === 0) {
            $container.html('<span class="overdue-months-empty">Nenhuma tarefa atrasada em outras competências.</span>');
            return;
        }

        var html = chaves.map(function(chave) {
            var item = meses[chave];
            var listaTarefas = '<div class="month-task-list-wrapper" style="display: none;"><div style="padding: 0 4px 4px 4px; margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">';
            item.tarefas.forEach(function(t) {
                listaTarefas += '<button type="button" class="overdue-task-item" data-task-id="'+ t.id +'" data-task-month="'+ t.startMes +'" style="display: flex; align-items: flex-start; gap: 8px; width: 100%; padding: 8px 10px; background: #fff5f2; border: 1px solid #ffc7b5; border-radius: 6px; cursor: pointer; text-align: left; transition: background 0.2s ease, border-color 0.2s ease;">' +
                                '<i class="fa-solid fa-circle-exclamation" style="font-size: 12px; color: #e74c3c; flex-shrink: 0; margin-top: 2px;"></i>' + 
                                '<span style="font-size: 11px; font-weight: 600; color: #991b1b;">' + t.name + '</span>' +
                                '</button>';
            });
            listaTarefas += '</div></div>';

            return '<div style="margin-bottom: 10px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.02); width: 100%;">' +
                   '<button type="button" class="toggle-month-btn" data-overdue-month="'+chave+'" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: none; border-bottom: 1px solid transparent; padding: 10px 12px; cursor: pointer; transition: background 0.2s;" title="Expandir/Recolher ' + that.formatarCompetencia(chave) + '">' +
                       '<div style="display: flex; gap: 10px; align-items: center;">' +
                           '<div style="background: #fee2e2; color: #e74c3c; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                           '<span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">' + that.formatarCompetencia(chave) + '</span>' +
                       '</div>' +
                       '<div style="display: flex; align-items: center; gap: 12px;">' +
                           '<strong style="background: rgba(231, 76, 60, 0.12); color: #b91c1c; border-radius: 999px; font-size: 11px; height: 22px; min-width: 22px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px;">' + item.total + '</strong>' +
                           '<i class="fa-solid fa-chevron-down month-toggle-icon" style="color: #64748b; font-size: 12px; transition: transform 0.3s ease;"></i>' +
                       '</div>' +
                   '</button>' +
                   listaTarefas +
                   '</div>';
        }).join("");

        $container.html(html);
    },

    renderFutureMonthIndicators: function() {
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        var $container = $widgetContext.find("#future-months-" + this.instanceId);
        var meses = {};
        
        if ($container.length === 0) return;

        var dataHoje = new Date(that.mockToday);
        var chaveMesAtual = dataHoje.getFullYear() + "-" + ("0" + (dataHoje.getMonth() + 1)).slice(-2);

        this.dadosCronograma.forEach(function(item) {
            if (item.end === "Data Inválida" || item.end === "A definir") return;

            var tInicio = that.parseDate(item.start) || that.parseDate(item.end);
            var status = (item.status || "").toLowerCase();
            var concluido = status === "concluído";

            if (!tInicio || concluido || tInicio <= that.mockToday) return;

            var dInicio = new Date(tInicio);
            var chaveMesInicio = dInicio.getFullYear() + "-" + ("0" + (dInicio.getMonth() + 1)).slice(-2);

            if (!meses[chaveMesInicio]) {
                meses[chaveMesInicio] = { total: 0, competencia: chaveMesInicio, tarefas: [] };
            }
            meses[chaveMesInicio].total++;
            meses[chaveMesInicio].tarefas.push({ id: item.id, name: item.name, startMes: chaveMesInicio });
        });

        var chaves = Object.keys(meses).sort();
        if (chaves.length === 0) {
            $container.html('<span class="future-months-empty" style="color: var(--text-muted); font-size: 11px; font-weight: 700;">Nenhuma atividade futura agendada.</span>');
            return;
        }

        var html = chaves.map(function(chave) {
            var item = meses[chave];
            var listaTarefas = '<div class="month-task-list-wrapper" style="display: none;"><div style="padding: 0 4px 4px 4px; margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">';
            item.tarefas.forEach(function(t) {
                listaTarefas += '<button type="button" class="future-task-item" data-task-id="'+ t.id +'" data-task-month="'+ t.startMes +'" style="display: flex; align-items: flex-start; gap: 8px; width: 100%; padding: 8px 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; cursor: pointer; text-align: left; transition: background 0.2s ease, border-color 0.2s ease;">' +
                                '<i class="fa-regular fa-calendar-plus" style="font-size: 12px; color: #0ea5e9; flex-shrink: 0; margin-top: 2px;"></i>' + 
                                '<span style="font-size: 11px; font-weight: 600; color: #0369a1;">' + t.name + '</span>' +
                                '</button>';
            });
            listaTarefas += '</div></div>';

            return '<div style="margin-bottom: 10px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.02); width: 100%;">' +
                   '<button type="button" class="toggle-month-btn" data-future-month="'+chave+'" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: none; border-bottom: 1px solid transparent; padding: 10px 12px; cursor: pointer; transition: background 0.2s;" title="Expandir/Recolher ' + that.formatarCompetencia(chave) + '">' +
                       '<div style="display: flex; gap: 10px; align-items: center;">' +
                           '<div style="background: #e0f2fe; color: #0284c7; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i class="fa-regular fa-calendar-plus"></i></div>' +
                           '<span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">' + that.formatarCompetencia(chave) + '</span>' +
                       '</div>' +
                       '<div style="display: flex; align-items: center; gap: 12px;">' +
                           '<strong style="background: rgba(2, 132, 199, 0.15); color: #0369a1; border-radius: 999px; font-size: 11px; height: 22px; min-width: 22px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px;">' + item.total + '</strong>' +
                           '<i class="fa-solid fa-chevron-down month-toggle-icon" style="color: #64748b; font-size: 12px; transition: transform 0.3s ease;"></i>' +
                       '</div>' +
                   '</button>' +
                   listaTarefas +
                   '</div>';
        }).join("");

        $container.html(html);
    },

    updateBpoIndicators: function(dadosFiltrados) {
        var lista = dadosFiltrados || [];
        var total = lista.length;
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        var mesSelecionado = $("#mesFiltro_" + this.instanceId).val();

        var fechamentoPonto = null;
        var holerites = null;
        var folhasProcessadas = 0;
        var folhasComRetrabalho = 0;
        var errosLancamento = 0;
        var custoFolha = 0;
        var colaboradores = 0;
        var desligamentos = 0;
        var admissoes = 0;
        var custoMovimentacao = 0;

        var temDadosQualidade = false;
        var temDadosCusto = false;
        var temDadosTurnover = false;

        var concluidas = 0;
        var atrasadas = 0;
        var pendentes = 0;

        lista.forEach(function(item) {
            var nome = (item.name || "").toLowerCase();
            var inicio = that.parseDate(item.start);
            var termino = that.parseDate(item.end);
            var status = (item.status || "").toLowerCase();
            var concluido = status === "concluído";

            if (concluido) { concluidas++; } else {
                pendentes++;
                if (termino !== null && termino < that.mockToday) atrasadas++;
            }

            if (nome.indexOf("fechamento") > -1 && nome.indexOf("ponto") > -1 && termino) { fechamentoPonto = fechamentoPonto === null ? termino : Math.min(fechamentoPonto, termino); }
            if ((nome.indexOf("holerite") > -1 || nome.indexOf("contracheque") > -1) && termino) { holerites = holerites === null ? termino : Math.max(holerites, termino); }
            if (!fechamentoPonto && nome.indexOf("ponto") > -1 && termino) fechamentoPonto = termino;
            if (!holerites && inicio && nome.indexOf("folha") > -1) holerites = termino || inicio;

            if (item.folhasProcessadas !== null) { folhasProcessadas += item.folhasProcessadas; temDadosQualidade = true; }
            if (item.folhasComRetrabalho !== null) { folhasComRetrabalho += item.folhasComRetrabalho; temDadosQualidade = true; }
            if (item.errosLancamento !== null) { errosLancamento += item.errosLancamento; temDadosQualidade = true; }
            if (item.custoFolha !== null) { custoFolha += item.custoFolha; temDadosCusto = true; }
            if (item.colaboradores !== null) { colaboradores = Math.max(colaboradores, item.colaboradores); temDadosCusto = true; temDadosTurnover = true; }
            if (item.desligamentos !== null) { desligamentos += item.desligamentos; temDadosTurnover = true; }
            if (item.admissoes !== null) { admissoes += item.admissoes; temDadosTurnover = true; }
            if (item.custoRescisoes !== null) { custoMovimentacao += item.custoRescisoes; temDadosTurnover = true; }
            if (item.custoAdmissoes !== null) { custoMovimentacao += item.custoAdmissoes; temDadosTurnover = true; }
        });

        var slaDias = null;
        if (fechamentoPonto !== null && holerites !== null && holerites >= fechamentoPonto) { slaDias = Math.ceil((holerites - fechamentoPonto) / (1000 * 60 * 60 * 24)); }

        var taxaAcerto = (temDadosQualidade && folhasProcessadas > 0) ? Math.max(0, Math.round(((folhasProcessadas - folhasComRetrabalho) / folhasProcessadas) * 1000) / 10) : null;
        var custoMedio = (temDadosCusto && colaboradores > 0) ? custoFolha / colaboradores : null;
        var turnover = (temDadosTurnover && colaboradores > 0) ? Math.round(((desligamentos + admissoes) / 2 / colaboradores) * 1000) / 10 : null;
        var aderenciaPrazo = total > 0 ? Math.max(0, Math.round(((total - atrasadas) / total) * 100)) : 0;
        var execucaoCronograma = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        var qualidadeEntrega = 0;
        var pontosQualidade = 0;

        if (slaDias !== null) { qualidadeEntrega += slaDias <= 2 ? 100 : (slaDias <= 5 ? 85 : 65); pontosQualidade++; }
        if (taxaAcerto !== null) { qualidadeEntrega += Math.min(100, taxaAcerto); pontosQualidade++; }
        if (temDadosQualidade) { qualidadeEntrega += errosLancamento === 0 ? 100 : Math.max(60, 100 - (errosLancamento * 5)); pontosQualidade++; }

        if (pontosQualidade === 0 && total > 0) { qualidadeEntrega = Math.round((aderenciaPrazo + execucaoCronograma) / 2); pontosQualidade = 1; }

        var saude = pontosQualidade > 0 ? Math.round(qualidadeEntrega / pontosQualidade) : 0;
        var saudeClasse = saude >= 90 ? "is-good" : (saude >= 75 ? "is-warning" : (saude > 0 ? "is-critical" : "is-neutral"));

        $widgetContext.find("#bpo-periodo-" + this.instanceId).text(this.formatarCompetencia(mesSelecionado));
        $widgetContext.find("#bpo-sla-processamento-" + this.instanceId).text(slaDias !== null ? slaDias + " dia(s)" : aderenciaPrazo + "%");
        $widgetContext.find("#bpo-sla-processamento-desc-" + this.instanceId).text(slaDias !== null ? "Do fechamento do ponto à liberação dos holerites" : "Aderência ao prazo do cronograma");
        $widgetContext.find("#bpo-taxa-acerto-" + this.instanceId).text(taxaAcerto !== null ? taxaAcerto.toString().replace(".", ",") + "%" : execucaoCronograma + "%");
        $widgetContext.find("#bpo-taxa-acerto-desc-" + this.instanceId).text(taxaAcerto !== null ? folhasComRetrabalho + " folha(s) com retrabalho" : concluidas + " de " + total + " etapa(s) concluídas");
        $widgetContext.find("#bpo-erros-lancamento-" + this.instanceId).text(temDadosQualidade ? errosLancamento : atrasadas);
        $widgetContext.find("#bpo-erros-lancamento-desc-" + this.instanceId).text(temDadosQualidade ? "Apontamentos incorretos reportados" : atrasadas + " pendência(s) crítica(s) no prazo");
        $widgetContext.find("#bpo-custo-colaborador-" + this.instanceId).text(custoMedio !== null ? this.formatCurrencyBR(custoMedio) : "--");
        $widgetContext.find("#bpo-custo-colaborador-desc-" + this.instanceId).text(custoMedio !== null ? colaboradores + " colaborador(es) considerados" : "Informe custo e headcount na gestão");
        $widgetContext.find("#bpo-turnover-" + this.instanceId).text(turnover !== null ? turnover.toString().replace(".", ",") + "%" : "--");
        $widgetContext.find("#bpo-turnover-desc-" + this.instanceId).text(turnover !== null ? this.formatCurrencyBR(custoMovimentacao) + " em rescisões/admissões" : "Informe admissões e desligamentos");
        
        $widgetContext.find("#bpo-saude-label-" + this.instanceId).text(saude + "%");
        $widgetContext.find("#bpo-saude-bar-" + this.instanceId).css("width", saude + "%").removeClass("is-good is-warning is-critical is-neutral").addClass(saudeClasse);
    },

    formatarCompetencia: function(val) {
        if (!val) return "-";
        var partes = val.split('-');
        var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        var mesNome = meses[parseInt(partes[1], 10) - 1] || "";
        return mesNome + "/" + partes[0];
    },

    changeContextToActivity: function(originalId, multipleStepsArray) {
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        
        $widgetContext.find('.calendar-day.has-tooltip').each(function() {
            var orig = $(this).attr('data-original-tooltip');
            if (orig) $(this).attr('data-tooltip', orig);
            $(this).removeClass('dimmed-day only-this-day');
        });

        if (multipleStepsArray && multipleStepsArray.length > 1) {
            var firstItemMulti = this.dadosCronograma.find(function(i) { return i.id == multipleStepsArray[0].id; });
            if (firstItemMulti && firstItemMulti.end && firstItemMulti.end !== "A definir" && firstItemMulti.end !== "Data Inválida") {
                var dFimMulti = new Date(that.parseDate(firstItemMulti.end));
                if (dFimMulti.getMonth() === that.currentDate.getMonth() && dFimMulti.getFullYear() === that.currentDate.getFullYear()) {
                    var diaVencMulti = dFimMulti.getDate();
                    $widgetContext.find('.calendar-day.event-end').each(function() {
                        if (parseInt($(this).text()) === diaVencMulti) { $(this).addClass('only-this-day'); } else { $(this).addClass('dimmed-day'); }
                    });
                }
            }

            var nomesAtividades = multipleStepsArray.map(function(s) { return "• " + s.name; }).join('<br>');
            var htmlMultiplo = '<div class="info-card" style="border-left: 4px solid var(--brand-orange);">' +
                '<div class="info-header"><i class="fa-solid fa-layer-group"></i> ' + multipleStepsArray.length + ' ATIVIDADES NESTE DIA</div>' +
                '<div class="info-body highlight" style="font-size: 11px; font-weight: bold; color: var(--primary-blue); margin-bottom: 12px; line-height: 1.4;">' + nomesAtividades + '</div>' +
                '<button class="btn btn-sm" id="btn-voltar-contexto-' + this.instanceId + '" style="background: var(--primary-blue); color: white; border: none; font-size: 10px; padding: 6px 12px; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><i class="fa-solid fa-arrow-left"></i> Voltar p/ Visão Geral</button>' +
            '</div>' +
            '<div class="info-card">' +
                '<div class="info-header"><i class="fa-regular fa-clock"></i> ATENÇÃO: CONCORRÊNCIA</div>' +
                '<div class="info-body">As atividades destacadas na tabela estão programadas ou vencem exatamente na mesma data. Foque em priorizá-las para não gerar gargalos no cronograma operacional.</div>' +
            '</div>';
            
            $widgetContext.find('.info-footer').hide().html(htmlMultiplo).fadeIn(300);
            $widgetContext.find("#btn-voltar-contexto-" + this.instanceId).on('click', function(e) { e.stopPropagation(); that.resetFilters(true); });
            return; 
        }

        var item = this.dadosCronograma.find(function(i) { return i.id == originalId; });
        if (!item) return;

        if (item.end && item.end !== "A definir" && item.end !== "Data Inválida") {
            var tFim = this.parseDate(item.end);
            var dFim = new Date(tFim);
            if (dFim.getMonth() === this.currentDate.getMonth() && dFim.getFullYear() === this.currentDate.getFullYear()) {
                var diaVencimento = dFim.getDate();
                $widgetContext.find('.calendar-day.event-end').each(function() {
                    if (parseInt($(this).text()) === diaVencimento) { $(this).addClass('only-this-day'); $(this).attr('data-tooltip', '■  ' + item.name); } else { $(this).addClass('dimmed-day'); }
                });
            } else { $widgetContext.find('.calendar-day.event-end').addClass('dimmed-day'); }
        } else { $widgetContext.find('.calendar-day.event-end').addClass('dimmed-day'); }
        
        var htmlContexto = '<div class="info-card" style="border-left: 4px solid var(--brand-orange);">' +
            '<div class="info-header"><i class="fa-solid fa-crosshairs"></i> ATIVIDADE SELECIONADA</div>' +
            '<div class="info-body highlight" style="font-size: 13px; font-weight: bold; color: var(--primary-blue); margin-bottom: 12px;">' + item.name + '</div>' +
            '<button class="btn btn-sm" id="btn-voltar-contexto-' + this.instanceId + '" style="background: var(--primary-blue); color: white; border: none; font-size: 10px; padding: 6px 12px; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><i class="fa-solid fa-arrow-left"></i> Voltar p/ Visão Geral</button>' +
        '</div>' +
        '<div class="info-card">' +
            '<div class="info-header"><i class="fa-regular fa-clock"></i> PERÍODO & STATUS</div>' +
            '<div class="info-body">' +
                '<strong>Timeline:</strong> ' + item.start + ' a ' + item.end + ' (' + item.duration + ' dias)<br>' +
                '<strong style="margin-top: 6px; display: inline-block;">Situação:</strong> ' + item.situacaoTemporal + '<br>' +
                '<strong style="margin-top: 2px; display: inline-block;">Status Fluig:</strong> ' + item.status + 
             '</div>' +
        '</div>' +
        '<div class="info-card">' +
            '<div class="info-header"><i class="fa-solid fa-user-tie"></i> RESPONSÁVEL</div>' +
            '<div class="info-body" style="font-weight: 800; font-size: 13px; color: var(--primary-blue); margin-top: 5px;">' + item.responsavel + '</div>' +
        '</div>';
        
        $widgetContext.find('.info-footer').hide().html(htmlContexto).fadeIn(300);
        $widgetContext.find("#btn-voltar-contexto-" + this.instanceId).on('click', function(e) { e.stopPropagation(); that.resetFilters(true); });
    },

    renderContextoGeral: function(dadosFiltrados) {
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        var inicioGeral = "-";
        var fimGeral = "-";
        
        var lista = dadosFiltrados || this.dadosCronograma;
        if(lista.length > 0) {
            var itemInicioGeral = lista.find(function(item) { return item.start !== "A definir" && item.start !== "Data Inválida"; });
            inicioGeral = itemInicioGeral ? itemInicioGeral.start : (lista[0].end || "-");
            fimGeral = lista[lista.length - 1].end;
        }

        var htmlContextoGeral = '<div class="info-card">' +
            '<div class="info-header"><i class="fa-regular fa-clock"></i> TIMELINE DO MÊS</div>' +
            '<div class="info-body highlight">' + inicioGeral + ' a ' + fimGeral + '</div>' +
        '</div>' +
        '<div class="info-card">' +
            '<div class="info-header"><i class="fa-solid fa-rocket"></i> OBJETIVO</div>' +
            '<div class="info-body">Garantir a transição e execução eficiente da operação do cliente.</div>' +
        '</div>' +
        '<div class="info-card">' +
            '<div class="info-header"><i class="fa-solid fa-chart-line"></i> BENEFÍCIOS AO CLIENTE</div>' +
            '<div class="info-body">' +
                '<ul style="margin: 0; padding-left: 15px;">' +
                    '<li>Operação padronizada</li>' +
                    '<li>Visibilidade em tempo real</li>' +
                    '<li>Foco no core business</li>' +
                '</ul>' +
            '</div>' +
        '</div>' +
        '<div class="info-card">' +
            '<div class="info-header"><i class="fa-solid fa-handshake-angle"></i> SLA DE ATENDIMENTO</div>' +
            '<div class="info-body">' +
                '<ul style="margin: 0; padding-left: 15px;">' +
                    '<li>Disponibilidade (Uptime): 99,8%</li>' +
                    '<li>Resposta a Chamados: &lt;4h</li>' +
                    '<li>Resolução Crítica: D+1</li>' +
                '</ul>' +
            '</div>' +
        '</div>';
        
        $widgetContext.find('.info-footer').hide().html(htmlContextoGeral).fadeIn(300);
    },

    extractDates: function() {
        var that = this;
        this.eventDates = {};
        
        var calAno = this.currentDate.getFullYear();
        var calMes = this.currentDate.getMonth();
        
        this.dadosCronograma.forEach(function(item) {
            var tFim = that.parseDate(item.end);
            if (!tFim) return;
            var dFim = new Date(tFim);
            
            if (dFim.getFullYear() === calAno && dFim.getMonth() === calMes) {
                var status = (item.status || "").toLowerCase();
                if (status !== 'concluído') {
                    var time = dFim.getTime();
                    if (!that.eventDates[time]) { that.eventDates[time] = { steps: [], isStart: false, isEnd: true }; }
                    
                    var tInicio = that.parseDate(item.start) || tFim;
                    var dInicio = new Date(tInicio);
                    var startMes = dInicio.getFullYear() + "-" + ("0" + (dInicio.getMonth() + 1)).slice(-2);
                    
                    that.eventDates[time].steps.push({ id: item.id, name: item.name.replace(/\n/g, ' ').trim(), type: 'Vencimento', startMes: startMes });
                }
            }
        });
    },

    updateSummaryCards: function() {
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        var countTotal = 0, countConcluidas = 0, countParaConcluir = 0, countAtrasadas = 0;
        
        $widgetContext.find('tbody tr').each(function() {
            var endColText = $(this).find('.date-end').text().trim();
            if(!endColText || !that.validarDataBanco(endColText)) return;
            
            countTotal++;
            var statusText = $(this).find('.status').text().trim().toLowerCase();
            var isConcluido = statusText.indexOf('concluído') > -1;
            
            if (isConcluido) { countConcluidas++; } else {
                countParaConcluir++;
                var e = endColText.split('/');
                var endTime = new Date(e[2], e[1]-1, e[0]).getTime();
                if (endTime < that.mockToday) { countAtrasadas++; }
            }
        });
        
        var $cardsValues = $widgetContext.find('.summary-card .card-value');
        if($cardsValues.length === 4) {
            $($cardsValues[0]).text(countAtrasadas);
            $($cardsValues[1]).text(countParaConcluir);
            $($cardsValues[2]).text(countConcluidas);
            $($cardsValues[3]).text(countTotal);
        }
    },

    resetFilters: function(resetContext) {
        if (resetContext === undefined) resetContext = true;
        
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        
        $widgetContext.find('.calendar-day').removeClass('selected-filter');
        $widgetContext.find('.bar-group').removeClass('bar-highlighted');
        $widgetContext.find('.summary-card').removeClass('active-card');
        
        $widgetContext.find('tbody tr').each(function() { $(this).show(); $(this).removeClass('row-highlighted'); });
        
        this.extractDates();
        this.renderCalendar(this.currentDate);

        if (resetContext) {
            var mesSelecionado = $("#mesFiltro_" + this.instanceId).val();
            var dadosAEnviar = this.dadosCronograma;
            
            if (mesSelecionado) {
                dadosAEnviar = this.dadosCronograma.filter(function(item) {
                    if (item.end === "Data Inválida" || item.end === "A definir") return false;
                    var tInicio = that.parseDate(item.start) || that.parseDate(item.end);
                    var dInicio = new Date(tInicio);
                    var itemMes = String(dInicio.getMonth() + 1).padStart(2, '0');
                    var itemAno = dInicio.getFullYear();
                    return (itemAno + '-' + itemMes === mesSelecionado);
                });
            }
            this.renderContextoGeral(dadosAEnviar);
        }
    },

    renderCalendar: function(date) {
        var that = this;
        var $widgetContext = $("#WidgetCronograma_" + this.instanceId);
        
        var $monthYear = $widgetContext.find("#month-year_" + this.instanceId);
        var $daysContainer = $widgetContext.find("#calendar-days_" + this.instanceId);
        var monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        var month = date.getMonth();
        var year = date.getFullYear();

        $monthYear.text(monthNames[month] + " " + year);
        $daysContainer.empty();
        
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var realToday = new Date();
        realToday.setHours(0,0,0,0);
        
        for (var i = 0; i < firstDay; i++) { $daysContainer.append('<div class="calendar-day empty"></div>'); }
        var listaVencimentosMês = []; 

        for (var j = 1; j <= daysInMonth; j++) {
            var $day = $('<div class="calendar-day">' + j + '</div>');
            var currentDayTime = new Date(year, month, j).getTime();
            var eventData = that.eventDates[currentDayTime];
            
            if (eventData) {
                $day.addClass("event-end"); 
                $day.css({'background-color': '#fee2e2', 'color': '#ef4444', 'font-weight': 'bold'});
                
                var tooltipLines = eventData.steps.map(function(s) { return "■  " + s.name; });
                var tooltipText = tooltipLines.join('\n\n');
                
                $day.attr('data-tooltip', tooltipText); 
                $day.attr('data-original-tooltip', tooltipText); 
                $day.addClass('has-tooltip');
                
                eventData.steps.forEach(function(s) { listaVencimentosMês.push({ dia: j, id: s.id, name: s.name, startMes: s.startMes }); });
                
                (function(currentEventData, currentDayElement) {
                    currentDayElement.on('click', function(e) {
                        e.stopPropagation();
                        that.resetFilters(true); 
                        
                        var firstStep = currentEventData.steps[0];
                        var taskMonth = firstStep.startMes;

                        that.currentDate = new Date(parseInt(taskMonth.split('-')[0], 10), parseInt(taskMonth.split('-')[1], 10) - 1, 1);
                        $widgetContext.find("#mesFiltro_" + that.instanceId).val(taskMonth);
                        that.atualizarTextoMes(taskMonth);
                        that.renderizarDados();
                        
                        setTimeout(function() {
                            var rolouTela = false;
                            currentEventData.steps.forEach(function(step) {
                                var targetId = '#step-' + step.id + '-' + that.instanceId;
                                var $targetRow = $widgetContext.find(targetId);
                                if ($targetRow.length > 0) {
                                    if (!rolouTela) { $targetRow[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); rolouTela = true; }
                                    $targetRow.addClass('row-highlighted');
                                }
                                var $targetBar = $widgetContext.find('.bar-group[data-step="' + step.id + '"]');
                                if ($targetBar.length > 0) { $targetBar.addClass('bar-highlighted'); }
                            });
                            that.changeContextToActivity(firstStep.id, currentEventData.steps);
                        }, 150);
                    });
                })(eventData, $day);

            } else {
                $day.on('click', function(e) { e.stopPropagation(); that.resetFilters(true); });
            }

            if (currentDayTime === realToday.getTime()) { $day.addClass("today"); }
            $daysContainer.append($day);
        }

        var $calContainer = $widgetContext.find(".calendar-legend");
        $widgetContext.find("#due-this-month-container-" + this.instanceId).remove();
        
        if (listaVencimentosMês.length > 0) {
            var mesNomeStr = monthNames[month] + "/" + year;
            var listHtml = '<div id="due-this-month-container-' + this.instanceId + '" class="due-months-panel" style="margin-top: 15px; border-top: 1px solid var(--border-color); background: #ffffff; padding: 12px; margin-bottom: 0;">' +
                           '<div class="due-months-title" style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; color: #ea580c;">' +
                               '<div style="display: flex; align-items: center; gap: 7px;"><i class="fa-regular fa-calendar-check" style="color: #ea580c;"></i><span>A Vencer Neste Mês</span></div>' +
                           '</div>' +
                           '<div style="margin-bottom: 10px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.02); width: 100%;">' +
                               '<button type="button" class="toggle-month-btn-due" data-current-month="' + year + '-' + ("0" + (month + 1)).slice(-2) + '" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: #fff7ed; border: none; border-bottom: 1px solid transparent; padding: 10px 12px; cursor: pointer; transition: background 0.2s;" title="Expandir/Recolher ' + mesNomeStr + '">' +
                                   '<div style="display: flex; gap: 10px; align-items: center;"><div style="background: #ffedd5; color: #ea580c; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i class="fa-regular fa-calendar-check"></i></div><span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">' + mesNomeStr + '</span></div>' +
                                   '<div style="display: flex; align-items: center; gap: 12px;"><strong style="background: rgba(234, 88, 12, 0.12); color: #9a3412; border-radius: 999px; font-size: 11px; height: 22px; min-width: 22px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px;">' + listaVencimentosMês.length + '</strong><i class="fa-solid fa-chevron-down month-toggle-icon" style="color: #64748b; font-size: 12px; transition: transform 0.3s ease;"></i></div>' +
                               '</button>' +
                               '<div class="month-task-list-wrapper" id="due-this-month-list-' + this.instanceId + '" style="display: none;"><div style="padding: 0 4px 4px 4px; margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">';
                               
            listaVencimentosMês.forEach(function(v) {
                listHtml += '<button type="button" class="vencimento-item" data-task-id="'+v.id+'" data-task-month="'+v.startMes+'" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 8px 10px; background: #fff; border: 1px solid #fed7aa; border-radius: 6px; cursor: pointer; text-align: left; transition: background 0.2s ease, border-color 0.2s ease;"><span style="font-size: 11px; font-weight: 600; color: #9a3412; white-space: normal; line-height: 1.4; word-break: break-word;">' + v.name + '</span><strong style="color: #ea580c; font-size: 10px; flex-shrink: 0; margin-left: 5px; margin-top: 2px;">Dia ' + ("0" + v.dia).slice(-2) + '</strong></button>';
            });
            listHtml += '</div></div></div></div>';
            
            $calContainer.after(listHtml);
            
            $widgetContext.find('.vencimento-item').on('click', function(e) {
                e.stopPropagation();
                that.resetFilters(true);
                var taskId = $(this).attr('data-task-id');
                var taskMonth = $(this).attr('data-task-month');
                
                that.currentDate = new Date(parseInt(taskMonth.split('-')[0], 10), parseInt(taskMonth.split('-')[1], 10) - 1, 1);
                $widgetContext.find("#mesFiltro_" + that.instanceId).val(taskMonth);
                that.atualizarTextoMes(taskMonth);
                that.renderizarDados();
                
                setTimeout(function() {
                    var targetId = '#step-' + taskId + '-' + that.instanceId;
                    var $targetRow = $widgetContext.find(targetId);
                    if ($targetRow.length > 0) { $targetRow[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); $targetRow.addClass('row-highlighted'); }
                    that.changeContextToActivity(taskId);
                }, 150);
            });
        }
    }
});