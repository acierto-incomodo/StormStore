print_header "1️⃣6️⃣ Configurando Prompt de Root"
print_info "Configurando el prompt (PS1) en /root/.bashrc..."
cat >> /root/.bashrc << 'EOF'

export PS1="\[\033[01;34m\] [Cardinal System] \[\033[00m\]- \[\033[01;32m\]\u@\h:\w\$ \[\033[00m\]"
EOF
print_success "Prompt de root configurado."