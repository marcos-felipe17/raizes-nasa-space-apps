import urllib.request
import urllib.error
import json
from pydantic import BaseModel
from fastapi import HTTPException

class LocalizacaoInput(BaseModel):
    nome_informado: str

def buscar_dados_nasa(lat: float, lon: float):
    """Consulta a API pública da NASA POWER com base nas coordenadas obtidas."""
    # Utilizando apenas os parâmetros de climatologia válidos para a comunidade AG
    url_nasa = (
        f"https://power.larc.nasa.gov/api/temporal/climatology/point?"
        f"parameters=T2M,PRECTOTCORR&community=AG&longitude={lon}&latitude={lat}&format=JSON"
    )
    
    req = urllib.request.Request(
        url_nasa,
        headers={'User-Agent': 'RaizesSpaceApps-Prototype'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            dados = json.loads(response.read().decode())
            parametros = dados.get("properties", {}).get("parameter", {})

            return {
                "status_nasa": "Dados integrados com sucesso",
                "temperatura_media_2m": parametros.get("T2M", {}),
                "precipitacao_media": parametros.get("PRECTOTCORR", {})
            }
    except urllib.error.HTTPError as e:
        # Captura o erro exato retornado pela NASA para facilitar o debug
        erro_detalhado = e.read().decode()
        return {
            "status_nasa": "Rejeitado pela API da NASA",
            "codigo_http": e.code,
            "detalhe": erro_detalhado
        }
    except Exception as e:
        return {
            "status_nasa": "Serviço temporariamente indisponível",
            "detalhe": str(e)
        }

def processar_localizacao(dados: LocalizacaoInput):
    query = urllib.parse.quote(dados.nome_informado)
    url_osm = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1"
    
    req_osm = urllib.request.Request(
        url_osm, 
        headers={'User-Agent': 'RaizesSpaceApps-Prototype'}
    )
    
    try:
        with urllib.request.urlopen(req_osm) as response:
            resultado = json.loads(response.read().decode())
            
            if resultado:
                local = resultado[0]
                lat = float(local["lat"])
                lon = float(local["lon"])
                nome_encontrado = local["display_name"]
                
                info_nasa = buscar_dados_nasa(lat, lon)
                
                return {
                    "regiao_id": f"geo-{lat:.2f}-{lon:.2f}",
                    "nome_exibicao": nome_encontrado,
                    "coordenadas_aproximadas": [lat, lon],
                    "dados_ambientais_nasa": info_nasa,
                    "status": "Localidade resolvida com sucesso!"
                }
    except Exception as e:
        pass
        
    raise HTTPException(
        status_code=404, 
        detail=f"Localidade '{dados.nome_informado}' não foi encontrada no mapeamento. Tente incluir o município ou uma referência mais próxima."
    )