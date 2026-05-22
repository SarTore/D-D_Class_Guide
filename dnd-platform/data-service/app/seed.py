"""
Popula as tabelas de referência (classes, subclasses, magias, talentos).

Uso (após `alembic upgrade head`):
    python -m app.seed

Aqui vai um recorte enxuto para validar a integração ponta a ponta. No app
final, este seed é substituído por um importador do SRD (ex.: Open5e), que
preenche as 12 classes, todas as magias por nível e os talentos.
"""
from __future__ import annotations

from .database import SessionLocal
from . import models


def run() -> None:
    db = SessionLocal()
    try:
        if db.query(models.GameClass).first():
            print("Referência já populada — nada a fazer.")
            return

        monge = models.GameClass(
            name="Monge",
            hit_die=8,
            primary_ability="Destreza + Sabedoria",
            saves="Força, Destreza",
            asi_levels=[4, 8, 12, 16, 19],
            caster_type=None,
        )
        db.add(monge)
        db.flush()  # garante monge.id

        # Algumas habilidades de classe do Monge
        db.add_all([
            models.ClassFeature(class_id=monge.id, level=1, name="Defesa sem Armadura",
                                description="Sem armadura nem escudo, CA = 10 + DES + SAB."),
            models.ClassFeature(class_id=monge.id, level=1, name="Artes Marciais",
                                description="Usa DES nos ataques desarmados; golpe bônus; dado 1d4 que cresce."),
            models.ClassFeature(class_id=monge.id, level=2, name="Ki",
                                description="Pontos de Ki = nível; alimentam técnicas. Recupera em descanso curto."),
            models.ClassFeature(class_id=monge.id, level=5, name="Golpe Atordoante",
                                description="Gaste 1 Ki ao acertar: salvaguarda de CON ou alvo atordoado."),
        ])

        # Tradições (subclasses) — só a Mão Aberta detalhada (SRD)
        mao_aberta = models.Subclass(
            class_id=monge.id, name="Mão Aberta", source="Livro do Jogador", srd=True,
            blurb="A tradição marcial: máximo controle e dano com a Rajada de Golpes.",
        )
        db.add(mao_aberta)
        db.flush()
        db.add_all([
            models.SubclassFeature(subclass_id=mao_aberta.id, level=3, name="Técnica da Mão Aberta",
                                   description="Rajada de Golpes pode derrubar, empurrar 4,5 m ou negar reações."),
            models.SubclassFeature(subclass_id=mao_aberta.id, level=6, name="Totalidade do Corpo",
                                   description="Como ação, cura 3 × nível de monge. 1×/descanso longo."),
            models.SubclassFeature(subclass_id=mao_aberta.id, level=11, name="Tranquilidade",
                                   description="Ganha efeito de Santuário ao fim do descanso longo."),
            models.SubclassFeature(subclass_id=mao_aberta.id, level=17, name="Palma Vibrante",
                                   description="Vibrações letais: salvaguarda de CON ou 10d10 necrótico."),
        ])
        for name, source in [
            ("Sombras", "Livro do Jogador"), ("Quatro Elementos", "Livro do Jogador"),
            ("Mestre Bêbado", "Guia de Xanathar"), ("Kensei", "Guia de Xanathar"),
            ("Alma Solar", "Guia de Xanathar / SCAG"), ("Morte Longa", "Guia da Costa da Espada"),
            ("Eu Astral", "Caldeirão de Tasha"), ("Misericórdia", "Caldeirão de Tasha"),
            ("Dragão Ascendente", "Tesouro de Fizban"),
        ]:
            db.add(models.Subclass(class_id=monge.id, name=name, source=source, srd=False, blurb=""))

        # Talentos
        db.add_all([
            models.Feat(name="Mobilidade", description="+3 m; não provoca AdO de quem você ataca corpo a corpo."),
            models.Feat(name="Alerta", description="+5 na iniciativa; não pode ser surpreendido."),
            models.Feat(name="Sortudo", description="3×/descanso longo, role um d20 extra e escolha."),
        ])

        # Magias (exemplo de truques e 1º nível)
        db.add_all([
            models.Spell(name="Raio de Fogo", level=0, school="Evocação",
                         description="Dardo de fogo: 1d10.", classes=["Mago", "Feiticeiro"]),
            models.Spell(name="Mísseis Mágicos", level=1, school="Evocação",
                         description="3 dardos que sempre acertam, 1d4+1 cada.", classes=["Mago", "Feiticeiro"]),
            models.Spell(name="Curar Ferimentos", level=1, school="Evocação",
                         description="Cura 1d8 + modificador ao toque.", classes=["Clérigo", "Druida", "Bardo", "Paladino", "Patrulheiro"]),
        ])

        db.commit()
        print("Seed concluído.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
