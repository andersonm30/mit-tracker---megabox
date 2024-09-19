<?php

function filterRelevantFields($data)
{
    if (!is_array($data)) {
        Log::warning('filterRelevantFields: $data não é um array.', ['data' => $data]);
        return [];
    }

    $filteredData = array_intersect_key($data, array_flip([
        'id', 'attributes', 'groupId', 'calendarId', 'name', 'bairro', 'birthDate', 'categoria', 'category', 'cep',
        'cidade', 'contact', 'contato1', 'contato2', 'contato2medidaprotetiva', 'contato3', 'cpf', 'cpfprotegida',
        'dataprisao', 'deficiencia', 'desccontato1', 'desccontato1medidaprotetiva', 'desccontato2', 'desccontato2medidaprotetiva',
        'desccontato3', 'disabled', 'dtativacao', 'dtdesativacao', 'endRes', 'estabelecimento', 'estadoCivil', 'etnia',
        'expirationTime', 'fatherName', 'gender', 'grau', 'imeimedidaprotetiva', 'imeiprotegida', 'justificativa', 'lastUpdate',
        'model', 'motherName', 'nacionalidade', 'naturalidade', 'nomecompleto', 'obs2', 'perfil', 'phone', 'positionId',
        'processos', 'prontuario', 'raiodistancimaneto', 'rgmonitorado', 'sexo', 'situacao', 'socialname', 'status',
        'telefonead', 'tipousuario', 'uf', 'uniqueId', 'uporigem', 'vara'
    ]));

    if (empty($filteredData)) {
        Log::warning('filterRelevantFields: Nenhuma chave relevante encontrada.', ['data' => $data]);
    }

    return $filteredData;
}

$testData = [
    'id' => 111,
    'attributes' => [
        'tarkan.color' => '0|1.00|1.00',
        'tarkan.color_extra' => '0|1.00|1.00'
    ],
    'groupId' => 0,
    'calendarId' => 0,
    'name' => 'Torn_M65_1914',
    // ... outros campos relevantes
    'unrelatedField' => 'this should not be included'
];

$filtered = filterRelevantFields($testData);
print_r($filtered);
